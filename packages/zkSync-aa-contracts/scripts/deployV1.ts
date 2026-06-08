/**
 * Deployment script for Verify 1: AA Smart Account
 * Deploys AAAccount implementation and AAFactory to zkSync Era Testnet
 *
 * Run: npx hardhat run scripts/deployV1.ts --network zkSyncTestnet
 */

import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";

interface DeploymentReport {
  timestamp: string;
  network: string;
  chainId: number;
  implementation: {
    address: string;
    txHash: string;
  };
  factory: {
    address: string;
    txHash: string;
  };
  accounts: Array<{
    owner: string;
    signers: string[];
    accountAddress: string;
    txHash: string;
  }>;
  status: "success" | "failed";
  error?: string;
}

async function main() {
  console.log("=" .repeat(80));
  console.log("VERIFY 1: AA SMART ACCOUNT DEPLOYMENT");
  console.log("=" .repeat(80));
  console.log();

  const [deployer, signer1, signer2, signer3, signer4, signer5, signer6] =
    await ethers.getSigners();

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const networkName = (await ethers.provider.getNetwork()).name;

  console.log("✓ Deployment Configuration");
  console.log(`  Network: ${networkName} (Chain ID: ${chainId})`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Signer 1: ${signer1.address}`);
  console.log(`  Signer 2: ${signer2.address}`);
  console.log(`  Signer 3: ${signer3.address}`);
  console.log();

  const report: DeploymentReport = {
    timestamp: new Date().toISOString(),
    network: networkName,
    chainId: Number(chainId),
    implementation: { address: "", txHash: "" },
    factory: { address: "", txHash: "" },
    accounts: [],
    status: "success",
  };

  try {
    // Step 1: Deploy AAAccount Implementation
    console.log("📦 Step 1: Deploying AAAccount Implementation");
    const AAAccountFactory = await ethers.getContractFactory("AAAccount");
    const aaAccountImpl = await AAAccountFactory.deploy();
    const aaAccountImplTx = aaAccountImpl.deploymentTransaction();

    if (!aaAccountImplTx) throw new Error("No deployment transaction");

    const implAddress = await aaAccountImpl.getAddress();
    const implTxHash = aaAccountImplTx.hash;

    console.log(`  ✓ Address: ${implAddress}`);
    console.log(`  ✓ Tx Hash: ${implTxHash}`);

    report.implementation.address = implAddress;
    report.implementation.txHash = implTxHash;

    // Wait for confirmation
    await aaAccountImpl.waitForDeployment();
    console.log(`  ✓ Confirmed on chain`);
    console.log();

    // Step 2: Deploy AAFactory
    console.log("📦 Step 2: Deploying AAFactory");
    const FactoryContract = await ethers.getContractFactory("AAFactory");
    const aaFactory = await FactoryContract.deploy(implAddress);
    const factoryTx = aaFactory.deploymentTransaction();

    if (!factoryTx) throw new Error("No deployment transaction");

    const factoryAddress = await aaFactory.getAddress();
    const factoryTxHash = factoryTx.hash;

    console.log(`  ✓ Address: ${factoryAddress}`);
    console.log(`  ✓ Tx Hash: ${factoryTxHash}`);

    report.factory.address = factoryAddress;
    report.factory.txHash = factoryTxHash;

    // Wait for confirmation
    await aaFactory.waitForDeployment();
    console.log(`  ✓ Confirmed on chain`);
    console.log();

    // Step 3: Create Test AA Accounts
    console.log("📦 Step 3: Creating Test AA Accounts");

    // Account 1: 2-of-3 multisig
    console.log("  Creating Account 1 (2-of-3 multisig)...");
    const signers1 = [signer1.address, signer2.address, signer3.address];
    const salt1 = ethers.id("account-1-test-salt");

    const createTx1 = await aaFactory.createAAAccount(
      signers1,
      deployer.address,
      salt1
    );
    const createReceipt1 = await createTx1.wait();

    const accounts1 = await aaFactory.getOwnerAccounts(deployer.address);
    const account1Address = accounts1[0];

    console.log(`  ✓ Account 1 Address: ${account1Address}`);
    console.log(`  ✓ Tx Hash: ${createTx1.hash}`);

    report.accounts.push({
      owner: deployer.address,
      signers: signers1,
      accountAddress: account1Address,
      txHash: createTx1.hash,
    });

    // Account 2: Different signers (for testing)
    console.log("  Creating Account 2 (2-of-3 multisig, different signers)...");
    const signers2 = [signer4.address, signer5.address, signer6.address];
    const salt2 = ethers.id("account-2-test-salt");

    const createTx2 = await aaFactory.createAAAccount(
      signers2,
      deployer.address,
      salt2
    );
    const createReceipt2 = await createTx2.wait();

    const accounts2 = await aaFactory.getOwnerAccounts(deployer.address);
    const account2Address = accounts2[accounts2.length - 1];

    console.log(`  ✓ Account 2 Address: ${account2Address}`);
    console.log(`  ✓ Tx Hash: ${createTx2.hash}`);

    report.accounts.push({
      owner: deployer.address,
      signers: signers2,
      accountAddress: account2Address,
      txHash: createTx2.hash,
    });

    console.log();

    // Step 4: Verify Accounts
    console.log("✅ Step 4: Verifying Accounts");

    for (let i = 0; i < report.accounts.length; i++) {
      const account = report.accounts[i];
      const aaAccount = await ethers.getContractAt("AAAccount", account.accountAddress);

      const signerCount = await aaAccount.signerCount();
      const requiredSignatures = await aaAccount.requiredSignatures();
      const nonce = await aaAccount.nonce();

      console.log(`  Account ${i + 1}:`);
      console.log(`    ✓ Address: ${account.accountAddress}`);
      console.log(`    ✓ Signer Count: ${signerCount}`);
      console.log(`    ✓ Required Signatures: ${requiredSignatures}`);
      console.log(`    ✓ Nonce: ${nonce}`);

      // Verify each signer
      for (const signer of account.signers) {
        const isValid = await aaAccount.isSignerRole(signer);
        if (!isValid) throw new Error(`Signer ${signer} not valid`);
      }
      console.log(`    ✓ All signers verified`);
    }

    console.log();

    // Step 5: Test Basic Functionality
    console.log("✅ Step 5: Testing Basic Functionality");

    const testAccount = await ethers.getContractAt(
      "AAAccount",
      report.accounts[0].accountAddress
    );

    // Test 1: Send ETH to account
    console.log("  Test 1: Sending ETH to account...");
    const amount = ethers.parseEther("0.1");
    const sendTx = await deployer.sendTransaction({
      to: report.accounts[0].accountAddress,
      value: amount,
    });
    await sendTx.wait();

    const balance = await ethers.provider.getBalance(
      report.accounts[0].accountAddress
    );
    console.log(`    ✓ Account balance: ${ethers.formatEther(balance)} ETH`);

    // Test 2: Call isSignerRole
    console.log("  Test 2: Verifying signer role...");
    const isValid = await testAccount.isSignerRole(signer1.address);
    console.log(`    ✓ Signer 1 valid: ${isValid}`);

    const isInvalid = await testAccount.isSignerRole(deployer.address);
    console.log(`    ✓ Non-signer rejected: ${!isInvalid}`);

    console.log();

    // Success Summary
    console.log("✅ DEPLOYMENT SUCCESSFUL");
    console.log("=" .repeat(80));
    console.log("SUMMARY");
    console.log("=" .repeat(80));
    console.log(`Network: ${report.network} (Chain ${report.chainId})`);
    console.log(`Implementation: ${report.implementation.address}`);
    console.log(`Factory: ${report.factory.address}`);
    console.log(`Accounts Created: ${report.accounts.length}`);
    console.log();

    // Save report
    const reportPath = path.join(
      __dirname,
      `../reports/VERIFY_1_DEPLOYMENT_${Date.now()}.json`
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);
    console.log();

    // Environment variables for next steps
    console.log("Environment Variables:");
    console.log(`REACT_APP_AA_IMPLEMENTATION=${report.implementation.address}`);
    console.log(`REACT_APP_AA_FACTORY=${report.factory.address}`);
    for (let i = 0; i < report.accounts.length; i++) {
      console.log(
        `REACT_APP_AA_ACCOUNT_${i + 1}=${report.accounts[i].accountAddress}`
      );
    }
    console.log();

    console.log("🎉 Ready for Verify 1 Integration Tests!");
  } catch (error) {
    console.error("❌ DEPLOYMENT FAILED");
    console.error(error);

    report.status = "failed";
    report.error = error instanceof Error ? error.message : String(error);

    const reportPath = path.join(
      __dirname,
      `../reports/VERIFY_1_DEPLOYMENT_ERROR_${Date.now()}.json`
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Error report saved: ${reportPath}`);

    process.exit(1);
  }
}

main();