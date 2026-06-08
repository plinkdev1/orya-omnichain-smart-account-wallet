// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IAccount.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";

/**
 * @title AAAccount
 * @notice Minimal 2-of-3 multi-signature Account Abstraction (AA) implementation for zkSync Era
 * @dev Implements ERC-4337 IAccount interface for zkSync Era
 */
contract AAAccount is IAccount, IERC1271, Initializable, UUPSUpgradeable, Ownable {
    using ECDSA for bytes32;
    using TransactionHelper for Transaction;

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    /// @notice Mapping of signer addresses to their active status (2-of-3 multi-sig)
    mapping(address => bool) public signers;

    /// @notice Count of active signers
    uint256 public signerCount;

    /// @notice Nonce for replay protection
    uint256 public nonce;

    /// @notice Required threshold for multi-sig (e.g., 2 of 3)
    uint256 public requiredSignatures;

    // =============================================================================
    // EVENTS
    // =============================================================================

    /// @notice Emitted when a signer is added
    event SignerAdded(address indexed signer);

    /// @notice Emitted when a signer is removed
    event SignerRemoved(address indexed signer);

    /// @notice Emitted when multi-sig transaction is executed
    event MultiSigExecuted(bytes32 indexed txHash, uint256 indexed nonce);

    /// @notice Emitted when transaction fails
    event TransactionFailed(bytes32 indexed txHash, string reason);

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    /// @notice Only valid signers can call
    modifier onlySigner() {
        require(signers[msg.sender], "Not a valid signer");
        _;
    }

    // =============================================================================
    // INITIALIZER
    // =============================================================================

    /**
     * @notice Initialize the AA account with initial signers
     * @param _signers Initial array of 3 signer addresses
     * @param _owner Account owner (typically a treasury or governance contract)
     */
    function initialize(address[] calldata _signers, address _owner) external initializer {
        require(_signers.length == 3, "Must provide exactly 3 signers");
        require(_owner != address(0), "Invalid owner");

        // Set signers
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer address");
            signers[_signers[i]] = true;
        }

        signerCount = 3;
        requiredSignatures = 2; // 2-of-3 multi-sig
        nonce = 0;

        _transferOwnership(_owner);
    }

    // =============================================================================
    // AA INTERFACE IMPLEMENTATION
    // =============================================================================

    /**
     * @notice Validates transaction and checks multi-sig requirements
     * @param _txHash Hash of the transaction
     * @param _transaction The transaction to validate
     * @return magic ERC-1271 magic value if valid, 0 otherwise
     */
    function validateTransaction(
        bytes32 _txHash,
        Transaction calldata _transaction
    ) external payable override returns (bytes4 magic) {
        return _validateTransaction(_txHash, _transaction);
    }

    /**
     * @notice Execute validated transaction
     * @param _transaction The transaction to execute
     */
    function executeTransaction(
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override {
        address txCaller = msg.sender;
        require(
            txCaller == address(BOOTLOADER_FORMAL_ADDRESS),
            "Only bootloader can call executeTransaction"
        );

        _executeTransaction(_transaction);

        emit MultiSigExecuted(_txHash, nonce++);
    }

    /**
     * @notice Execute transaction from outside (for testing purposes)
     * @param _transaction The transaction to execute
     */
    function executeTransactionFromOutside(
        Transaction calldata _transaction
    ) external payable {
        _executeTransaction(_transaction);
        emit MultiSigExecuted(keccak256(abi.encode(_transaction)), nonce++);
    }

    /**
     * @notice Pay for transaction (called by bootloader)
     * @param _txHash Hash of the transaction
     * @param _suggestedSignedHash Suggested signed hash
     * @param _transaction The transaction
     */
    function payForTransaction(
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override {
        bool isFromBootloader = msg.sender == address(BOOTLOADER_FORMAL_ADDRESS);
        require(isFromBootloader, "Only bootloader can call payForTransaction");

        uint256 totalRequiredBalance = _transaction.totalRequiredBalance();
        require(address(this).balance >= totalRequiredBalance, "Not enough balance for transaction");
    }

    /**
     * @notice Prepare for paymaster (called by bootloader)
     * @param _txHash Hash of the transaction
     * @param _suggestedSignedHash Suggested signed hash
     * @param _transaction The transaction
     */
    function prepareForPaymaster(
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override {}

    // =============================================================================
    // MULTI-SIG LOGIC
    // =============================================================================

    /**
     * @notice Check if address is a valid signer
     * @param _address Address to check
     * @return bool True if address is a valid signer
     */
    function isSignerRole(address _address) external view returns (bool) {
        return signers[_address];
    }

    /**
     * @notice Add a new signer (owner only)
     * @param _newSigner Address of new signer
     */
    function addSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        require(!signers[_newSigner], "Address already a signer");

        signers[_newSigner] = true;
        signerCount++;

        emit SignerAdded(_newSigner);
    }

    /**
     * @notice Remove a signer (owner only)
     * @param _signer Address of signer to remove
     */
    function removeSigner(address _signer) external onlyOwner {
        require(signers[_signer], "Not a signer");
        require(signerCount > requiredSignatures, "Cannot remove: would fall below quorum");

        signers[_signer] = false;
        signerCount--;

        emit SignerRemoved(_signer);
    }

    /**
     * @notice Recover signatures from transaction
     * @param _txHash Transaction hash
     * @param _signatures Concatenated signatures
     * @return recoveredAddresses Array of recovered signer addresses
     */
    function recoverSignatures(
        bytes32 _txHash,
        bytes calldata _signatures
    ) external pure returns (address[] memory recoveredAddresses) {
        require(_signatures.length % 65 == 0, "Invalid signatures length");

        recoveredAddresses = new address[](_signatures.length / 65);

        for (uint256 i = 0; i < _signatures.length / 65; i++) {
            bytes memory signature = _signatures[i * 65 : (i + 1) * 65];
            address recovered = _txHash.recover(signature);
            recoveredAddresses[i] = recovered;
        }
    }

    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================

    /**
     * @notice Internal validation logic
     */
    function _validateTransaction(
        bytes32 _txHash,
        Transaction calldata _transaction
    ) internal view returns (bytes4 magic) {
        // Verify nonce
        require(_transaction.nonce == nonce, "Invalid nonce");

        // Extract signatures from calldata
        bytes calldata signatures = _transaction.signature;

        // Verify we have required signatures
        require(signatures.length >= requiredSignatures * 65, "Insufficient signatures");

        // Recover signers
        uint256 validSignatures = 0;
        for (uint256 i = 0; i < requiredSignatures; i++) {
            bytes memory signature = signatures[i * 65 : (i + 1) * 65];
            address recovered = _txHash.recover(signature);

            if (signers[recovered]) {
                validSignatures++;
            }
        }

        require(validSignatures >= requiredSignatures, "Quorum not met");

        return ACCOUNT_VALIDATION_SUCCESS_MAGIC;
    }

    /**
     * @notice Execute the transaction
     */
    function _executeTransaction(Transaction calldata _transaction) internal {
        address to = address(uint160(_transaction.to));
        uint256 value = _transaction.value;
        bytes calldata data = _transaction.data;

        bool success;
        bytes memory result;

        if (data.length > 0) {
            (success, result) = to.call{value: value}(data);
        } else {
            (success, result) = to.call{value: value}("");
        }

        if (!success) {
            if (result.length > 0) {
                assembly {
                    revert(add(result, 0x20), mload(result))
                }
            }
            revert("Transaction execution failed");
        }
    }

    // =============================================================================
    // UPGRADEABILITY
    // =============================================================================

    /**
     * @notice Authorize contract upgrade (owner only)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // =============================================================================
    // RECEIVE & FALLBACK
    // =============================================================================

    /**
     * @notice Receive ETH
     */
    receive() external payable {}

    /**
     * @notice Fallback function
     */
    fallback() external {}

    // =============================================================================
    // ERC-1271 SIGNATURE VALIDATION
    // =============================================================================

    /**
     * @notice Validate signature compliance with ERC-1271
     */
    function isValidSignature(bytes32 hash, bytes calldata signature) external view override returns (bytes4) {
        address recovered = hash.recover(signature);

        if (signers[recovered]) {
            return IERC1271.isValidSignature.selector;
        }

        return bytes4(0);
    }
}