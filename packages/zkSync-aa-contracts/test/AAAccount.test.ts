import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AAAccount, AAFactory } from "../typechain-types";

describe("AAAccount & AAFactory", function () {
  let aaAccount: AAAccount;
  let aaFactory: AAFactory;
  let owner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let signer3: SignerWithAddress;
  let user: SignerWithAddress;

  before(async () => {
    [owner, signer1, signer2, signer3, user] = await ethers.getSigners();
  });

  describe("AAFactory Deployment", function () {
    it("Should deploy AAFactory with implementation", async function () {
      // Deploy AAAccount implementation
      const AAAccountFactory = await ethers.getContractFactory("AAAccount");
      const implementation = await AAAccountFactory.deploy();
      await implementation.waitForDeployment();

      // Deploy AAFactory
      const Factory = await ethers.getContractFactory("AAFactory");
      aaFactory = await Factory.deploy(await implementation.getAddress());
      await aaFactory.waitForDeployment();

      expect(await aaFactory.implementation()).to.equal(
        await implementation.getAddress()
      );
    });
  });

  describe("Account Creation", function () {
    it("Should create AA account with 3 signers", async function () {
      const signers = [signer1.address, signer2.address, signer3.address];
      const salt = ethers.id("test-salt-1");

      const tx = await aaFactory.createAAAccount(signers, owner.address, salt);
      const receipt = await tx.wait();

      expect(receipt).not.to.be.null;
      expect(receipt!.logs.length).to.be.greaterThan(0);

      const createdAccounts = await aaFactory.getOwnerAccounts(owner.address);
      expect(createdAccounts.length).to.equal(1);

      aaAccount = await ethers.getContractAt(
        "AAAccount",
        createdAccounts[0]
      ) as AAAccount;

      expect(await aaAccount.signerCount()).to.equal(3);
      expect(await aaAccount.requiredSignatures()).to.equal(2);
    });

    it("Should fail with invalid signer count", async function () {
      const signers = [signer1.address, signer2.address]; // Only 2 signers
      const salt = ethers.id("test-salt-2");

      await expect(
        aaFactory.createAAAccount(signers, owner.address, salt)
      ).to.be.revertedWith("Must provide exactly 3 signers");
    });

    it("Should fail with invalid owner", async function () {
      const signers = [signer1.address, signer2.address, signer3.address];
      const salt = ethers.id("test-salt-3");

      await expect(
        aaFactory.createAAAccount(signers, ethers.ZeroAddress, salt)
      ).to.be.revertedWith("Invalid owner address");
    });

    it("Should fail with duplicate signers", async function () {
      const signers = [signer1.address, signer1.address, signer3.address]; // Duplicate
      const salt = ethers.id("test-salt-4");

      await expect(
        aaFactory.createAAAccount(signers, owner.address, salt)
      ).to.be.revertedWith("Duplicate signer");
    });
  });

  describe("Signer Management", function () {
    it("Should verify signers", async function () {
      expect(await aaAccount.isSignerRole(signer1.address)).to.be.true;
      expect(await aaAccount.isSignerRole(signer2.address)).to.be.true;
      expect(await aaAccount.isSignerRole(signer3.address)).to.be.true;
      expect(await aaAccount.isSignerRole(user.address)).to.be.false;
    });

    it("Should add signer (owner only)", async function () {
      const newSigner = user.address;

      const tx = await aaAccount.connect(owner).addSigner(newSigner);
      await tx.wait();

      expect(await aaAccount.isSignerRole(newSigner)).to.be.true;
      expect(await aaAccount.signerCount()).to.equal(4);
    });

    it("Should fail adding duplicate signer", async function () {
      await expect(
        aaAccount.connect(owner).addSigner(signer1.address)
      ).to.be.revertedWith("Address already a signer");
    });

    it("Should remove signer (owner only)", async function () {
      const currentSigners = 4;
      const tx = await aaAccount.connect(owner).removeSigner(user.address);
      await tx.wait();

      expect(await aaAccount.isSignerRole(user.address)).to.be.false;
      expect(await aaAccount.signerCount()).to.equal(currentSigners - 1);
    });

    it("Should fail removing below quorum", async function () {
      // Current signers: 3, required: 2
      // Removing one would leave 2, which equals required
      const signers = await aaAccount.signerCount();
      const required = await aaAccount.requiredSignatures();

      if (signers === required + 1) {
        const signerToRemove = signer3.address;
        await expect(
          aaAccount.connect(owner).removeSigner(signerToRemove)
        ).to.be.revertedWith("Cannot remove: would fall below quorum");
      }
    });

    it("Should fail adding signer (not owner)", async function () {
      await expect(
        aaAccount.connect(signer1).addSigner(user.address)
      ).to.be.revertedWithoutReason(); // Ownable revert
    });
  });

  describe("Multi-Signature Validation", function () {
    it("Should verify transaction nonce", async function () {
      const nonce = await aaAccount.nonce();
      expect(nonce).to.equal(0);
    });

    it("Should recover signatures correctly", async function () {
      const txHash = ethers.id("test-transaction");

      // Sign with first two signers
      const sig1 = await signer1.signMessage(ethers.getBytes(txHash));
      const sig2 = await signer2.signMessage(ethers.getBytes(txHash));

      const signatures = sig1 + sig2.slice(2); // Concatenate signatures

      const recovered = await aaAccount.recoverSignatures(
        txHash,
        signatures
      );

      expect(recovered.length).to.be.greaterThanOrEqual(2);
    });
  });

  describe("Account Functions", function () {
    it("Should receive ETH", async function () {
      const accountAddress = await aaAccount.getAddress();
      const amount = ethers.parseEther("1");

      const tx = await owner.sendTransaction({
        to: accountAddress,
        value: amount,
      });
      await tx.wait();

      const balance = await ethers.provider.getBalance(accountAddress);
      expect(balance).to.equal(amount);
    });

    it("Should execute external transaction", async function () {
      // Create a simple receiver contract
      const receiverFactory = await ethers.getContractFactory("MockReceiver");
      const receiver = await receiverFactory.deploy();
      await receiver.waitForDeployment();

      const accountAddress = await aaAccount.getAddress();
      const receiverAddress = await receiver.getAddress();

      // Send ETH to account first
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: accountAddress,
        value: amount,
      });

      // Create transaction data
      const callData = receiver.interface.encodeFunctionData("receive");

      // Execute transaction
      const tx = await aaAccount.executeTransactionFromOutside({
        from: accountAddress,
        to: receiverAddress,
        data: callData,
        value: 0,
        gasLimit: 100000,
        gasPrice: 1,
        nonce: 0,
        factoryDeps: [],
        customSignature: "0x",
        paymasterParams: {
          paymaster: ethers.ZeroAddress,
          paymasterInput: "0x",
        },
      });

      await tx.wait();
      expect(await receiver.called()).to.be.true;
    });
  });

  describe("Factory Query Functions", function () {
    it("Should check if account is valid", async function () {
      const accountAddress = await aaAccount.getAddress();
      expect(await aaFactory.isAAAccount(accountAddress)).to.be.true;
      expect(await aaFactory.isAAAccount(ethers.ZeroAddress)).to.be.false;
    });

    it("Should get owner account count", async function () {
      const count = await aaFactory.getOwnerAccountCount(owner.address);
      expect(count).to.be.greaterThanOrEqual(1);
    });

    it("Should get all owner accounts", async function () {
      const accounts = await aaFactory.getOwnerAccounts(owner.address);
      expect(accounts.length).to.be.greaterThanOrEqual(1);
      expect(accounts).to.include(await aaAccount.getAddress());
    });
  });

  describe("ERC-1271 Signature Validation", function () {
    it("Should validate signature from signer", async function () {
      const hash = ethers.id("test-message");
      const signature = await signer1.signMessage(ethers.getBytes(hash));

      const result = await aaAccount.isValidSignature(hash, signature);
      expect(result).to.equal("0x1626ba7e"); // ERC-1271 success magic
    });

    it("Should reject signature from non-signer", async function () {
      const hash = ethers.id("test-message");
      const signature = await user.signMessage(ethers.getBytes(hash));

      const result = await aaAccount.isValidSignature(hash, signature);
      expect(result).to.equal("0x00000000"); // ERC-1271 failure
    });
  });

  describe("Integration: Multi-Sig Flow", function () {
    it("Should execute 2-of-3 multi-sig flow", async function () {
      const accountAddress = await aaAccount.getAddress();

      // Prepare transaction
      const txHash = ethers.id("multi-sig-tx");

      // Get signatures from first two signers
      const sig1 = await signer1.signMessage(ethers.getBytes(txHash));
      const sig2 = await signer2.signMessage(ethers.getBytes(txHash));

      // Verify signatures are recoverable
      const recovered = await aaAccount.recoverSignatures(
        txHash,
        sig1 + sig2.slice(2)
      );

      expect(recovered.length).to.equal(2);
      expect(
        recovered.includes(signer1.address) &&
          recovered.includes(signer2.address)
      ).to.be.true;
    });
  });

  describe("Audit Events", function () {
    it("Should emit SignerAdded event", async function () {
      const newSigner = user.address;

      const tx = await aaAccount.connect(owner).addSigner(newSigner);
      const receipt = await tx.wait();

      const events = receipt!.logs;
      expect(events.length).to.be.greaterThan(0);
    });
  });
});

// Mock contract for testing
describe("MockReceiver", function () {
  it("Should be deployable", async function () {
    const ReceiverFactory = await ethers.getContractFactory("MockReceiver");
    const receiver = await ReceiverFactory.deploy();
    await receiver.waitForDeployment();

    const tx = await receiver.receive();
    await tx.wait();

    expect(await receiver.called()).to.be.true;
  });
});