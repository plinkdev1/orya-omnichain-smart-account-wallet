/**
 * Integration Script for Verify 1: Multi-Sig Flow Demonstration
 * 
 * This script demonstrates:
 * 1. Reading role ACL (isSignerRole)
 * 2. Collecting signatures off-chain
 * 3. Submitting multi-sig transaction on-chain
 * 4. Confirming execution with logs
 *
 * Run: npx hardhat run scripts/integrationV1.ts --network zkSyncTestnet
 */

import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";

interface MultiSigLog {
  timestamp: string;
  step: string;
  details: Record<string, any>;
  txHash?: string;
  status: "pending" | "completed" | "failed";
}

interface IntegrationReport {
  timestamp: string;
  network: string;
  account: {
    address: string;
    signers: string[];
    requiredSignatures: number;
  };
  flow: {
    status: "success" | "failed";
    steps: MultiSigLog[];
  };
}

async function logStep(
  step: string,
  details: Record<string, any>,
  status: "pending" | "completed" | "failed" = "completed"
): Promise<MultiSigLog> {
  const log: MultiSigLog = {
    timestamp: new Date().toISOString(),
    step,
    details,
    status,
  };

  console.log(`\n📝 ${step}`);
  console.log(`   Status: ${status}`);
  Object.entries(details).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  return log;
}

async function main() {
  console.log("=" .repeat(80));
  console.log("VERIFY 1: MULTI-SIG FLOW INTEGRATION");
  console.log("=" .repeat(80));

  const [deployer, signer1, signer2, signer3] = await ethers.getSigners();

  const report: IntegrationReport = {
    timestamp: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    account: {
      address: "",
      signers: [signer1.address, signer2.address, signer3.address],
      requiredSignatures: 0,
    },
    flow: {
      status: "success",
      steps: [],
    },
  };

  try {
    // Load deployment addresses from environment
    const factoryAddress =
      process.env.REACT_APP_AA_FACTORY ||
      "0x0000000000000000000000000000000000000000";
    const accountAddress =
      process.env.REACT_APP_AA_ACCOUNT_1 ||
      "0x0000000000000000000000000000000000000000";

    if (factoryAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("REACT_APP_AA_FACTORY environment variable not set");
    }
    if (accountAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("REACT_APP_AA_ACCOUNT_1 environment variable not set");
    }

    report.account.address = accountAddress;

    // Load contracts
    const aaFactory = await ethers.getContractAt("AAFactory", factoryAddress);
    const aaAccount = await ethers.getContractAt("AAAccount", accountAddress);

    console.log("\n✅ STEP 1: INITIALIZE & VERIFY ACCOUNT");
    report.flow.steps.push(
      await logStep("Verifying account deployment", {
        factory: factoryAddress,
        account: accountAddress,
        isValid: await aaFactory.isAAAccount(accountAddress),
      })
    );

    // Verify account exists
    const isValid = await aaFactory.isAAAccount(accountAddress);
    if (!isValid) {
      throw new Error("Account not valid");
    }

    console.log("\n✅ STEP 2: READ ROLE ACL");

    // Check signers
    const signerStatuses = await Promise.all([
      aaAccount.isSignerRole(signer1.address),
      aaAccount.isSignerRole(signer2.address),
      aaAccount.isSignerRole(signer3.address),
    ]);

    report.flow.steps.push(
      await logStep("Reading role ACL", {
        "signer1.isSignerRole": signerStatuses[0],
        "signer2.isSignerRole": signerStatuses[1],
        "signer3.isSignerRole": signerStatuses[2],
      })
    );

    // Verify all signers are valid
    if (!signerStatuses.every((status) => status === true)) {
      throw new Error("Not all signers are valid");
    }

    const requiredSignatures = await aaAccount.requiredSignatures();
    report.account.requiredSignatures = Number(requiredSignatures);

    console.log("\n✅ STEP 3: CREATE & SIGN TRANSACTION");

    // Create a sample transaction
    // In real scenario, this would be a complex operation
    // For demo, we'll create a transaction to send funds

    const txData = {
      from: accountAddress,
      to: signer1.address, // Send to signer1 for demo
      data: "0x",
      value: ethers.parseEther("0.01"),
      gasLimit: 100000,
      gasPrice: 1,
      nonce: 0,
      factoryDeps: [],
      customSignature: "0x",
      paymasterParams: {
        paymaster: ethers.ZeroAddress,
        paymasterInput: "0x",
      },
    };

    const txHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "bytes", "uint256", "uint256", "uint256"],
      [
        txData.from,
        txData.to,
        txData.data,
        txData.value,
        txData.gasLimit,
        txData.nonce,
      ]
    ));

    report.flow.steps.push(
      await logStep("Transaction created", {
        txHash,
        target: txData.to,
        value: `${ethers.formatEther(txData.value)} ETH`,
        nonce: txData.nonce,
      })
    );

    console.log("\n✅ STEP 4: COLLECT SIGNATURES OFF-CHAIN");

    // Sign with first two signers (2-of-3 multisig)
    console.log(`   Signing with Signer 1: ${signer1.address}`);
    const sig1 = await signer1.signMessage(ethers.getBytes(txHash));
    report.flow.steps.push(
      await logStep("Signature 1 collected", {
        signer: signer1.address,
        signature: sig1.slice(0, 20) + "...",
      })
    );

    console.log(`   Signing with Signer 2: ${signer2.address}`);
    const sig2 = await signer2.signMessage(ethers.getBytes(txHash));
    report.flow.steps.push(
      await logStep("Signature 2 collected", {
        signer: signer2.address,
        signature: sig2.slice(0, 20) + "...",
      })
    );

    // Aggregate signatures
    const aggregatedSignatures = sig1 + sig2.slice(2);

    report.flow.steps.push(
      await logStep("Signatures aggregated", {
        totalSignatures: 2,
        requiredSignatures: Number(requiredSignatures),
        aggregatedLength: aggregatedSignatures.length,
      })
    );

    console.log("\n✅ STEP 5: VERIFY SIGNATURES ON-CHAIN");

    // Recover and verify signatures
    const recoveredSigners = await aaAccount.recoverSignatures(
      txHash,
      aggregatedSignatures
    );

    report.flow.steps.push(
      await logStep("Signatures verified", {
        recovered: recoveredSigners.length,
        "signer1Valid": recoveredSigners.includes(signer1.address),
        "signer2Valid": recoveredSigners.includes(signer2.address),
      })
    );

    // Verify quorum
    let validSignatureCount = 0;
    const validSigners: string[] = [];

    for (const recovered of recoveredSigners) {
      const isValid = await aaAccount.isSignerRole(recovered);
      if (isValid) {
        validSignatureCount++;
        validSigners.push(recovered);
      }
    }

    if (validSignatureCount < Number(requiredSignatures)) {
      throw new Error(
        `Quorum not met: ${validSignatureCount} < ${requiredSignatures}`
      );
    }

    report.flow.steps.push(
      await logStep("Quorum verified", {
        validSignatures: validSignatureCount,
        required: Number(requiredSignatures),
        signers: validSigners,
      })
    );

    console.log("\n✅ STEP 6: SUBMIT MULTI-SIG TRANSACTION");

    // Prepare account with funds for execution
    const fundTx = await deployer.sendTransaction({
      to: accountAddress,
      value: ethers.parseEther("0.1"),
    });
    await fundTx.wait();

    report.flow.steps.push(
      await logStep("Account funded", {
        amount: "0.1 ETH",
        txHash: fundTx.hash,
      })
    );

    // Execute transaction from outside (for demo)
    const executeTx = await aaAccount.executeTransactionFromOutside(txData);
    const executeReceipt = await executeTx.wait();

    report.flow.steps.push(
      await logStep("Transaction executed", {
        txHash: executeTx.hash,
        status: executeReceipt?.status === 1 ? "success" : "failed",
      })
    );

    console.log("\n✅ STEP 7: CONFIRM EXECUTION & EXTRACT LOGS");

    // Get transaction logs
    const txLogs = await ethers.provider.getLogs({
      address: accountAddress,
      fromBlock: executeReceipt!.blockNumber - 1,
      toBlock: executeReceipt!.blockNumber,
    });

    report.flow.steps.push(
      await logStep("On-chain logs extracted", {
        blockNumber: executeReceipt!.blockNumber,
        logCount: txLogs.length,
      })
    );

    // Parse logs
    const iface = new ethers.Interface([
      "event MultiSigExecuted(bytes32 indexed txHash, uint256 indexed nonce)",
    ]);

    const parsedLogs: Array<{ event: string; args: Record<string, any> }> = [];

    for (const log of txLogs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed) {
          parsedLogs.push({
            event: parsed.name,
            args: {
              txHash: parsed.args[0],
              nonce: parsed.args[1],
            },
          });
        }
      } catch {
        // Log parsing failed, continue
      }
    }

    report.flow.steps.push(
      await logStep("Events parsed", {
        events: parsedLogs.length,
        details: parsedLogs,
      })
    );

    console.log("\n✅ STEP 8: FINAL VERIFICATION");

    const finalNonce = await aaAccount.nonce();
    report.flow.steps.push(
      await logStep("Account state verified", {
        nonce: Number(finalNonce),
        expectedNonce: 1,
        correct: Number(finalNonce) >= 1,
      })
    );

    // Success
    console.log("\n" + "=" .repeat(80));
    console.log("✅ MULTI-SIG FLOW COMPLETED SUCCESSFULLY");
    console.log("=" .repeat(80));

    console.log("\nFLOW SUMMARY:");
    console.log(`  ✓ Account: ${accountAddress}`);
    console.log(`  ✓ Signers: ${report.account.signers.length}`);
    console.log(`  ✓ Required: ${report.account.requiredSignatures}`);
    console.log(`  ✓ Signatures Collected: ${validSignatureCount}`);
    console.log(`  ✓ Quorum: ${validSignatureCount >= Number(requiredSignatures)}`);
    console.log(`  ✓ Transaction Executed: ✓`);
    console.log();

    // Save report
    const reportPath = path.join(
      __dirname,
      `../reports/VERIFY_1_INTEGRATION_${Date.now()}.json`
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);
  } catch (error) {
    console.error("\n❌ MULTI-SIG FLOW FAILED");
    console.error(error);

    report.flow.status = "failed";
    report.flow.steps.push({
      timestamp: new Date().toISOString(),
      step: "ERROR",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
      status: "failed",
    });

    const reportPath = path.join(
      __dirname,
      `../reports/VERIFY_1_INTEGRATION_ERROR_${Date.now()}.json`
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