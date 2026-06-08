// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./AAAccount.sol";

/**
 * @title AAFactory
 * @notice Factory for creating 2-of-3 multi-signature AA accounts on zkSync Era
 * @dev Uses ERC-1967 proxy pattern for upgradeable accounts
 */
contract AAFactory {
    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    /// @notice Implementation contract for AA accounts
    address public implementation;

    /// @notice Mapping from owner to array of created accounts
    mapping(address => address[]) public ownerAccounts;

    /// @notice Mapping to check if an address is a valid AA account created by this factory
    mapping(address => bool) public isValidAccount;

    // =============================================================================
    // EVENTS
    // =============================================================================

    /// @notice Emitted when a new AA account is created
    event AAAccountCreated(
        address indexed accountAddress,
        address indexed owner,
        address[] signers,
        uint256 indexed timestamp
    );

    /// @notice Emitted when implementation is updated
    event ImplementationUpdated(address indexed newImplementation);

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    /**
     * @notice Initialize factory with AA account implementation
     * @param _implementation Address of AAAccount implementation contract
     */
    constructor(address _implementation) {
        require(_implementation != address(0), "Invalid implementation address");
        implementation = _implementation;
        emit ImplementationUpdated(_implementation);
    }

    // =============================================================================
    // ACCOUNT CREATION
    // =============================================================================

    /**
     * @notice Create a new AA account with given signers and owner
     * @param _signers Array of 3 signer addresses for the account
     * @param _owner Address of the account owner
     * @param _salt Salt for creating deterministic addresses
     * @return accountAddress Address of the created AA account
     */
    function createAAAccount(
        address[] calldata _signers,
        address _owner,
        bytes32 _salt
    ) external returns (address accountAddress) {
        require(_signers.length == 3, "Must provide exactly 3 signers");
        require(_owner != address(0), "Invalid owner address");

        // Validate signers
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer address");
            // Check for duplicates
            for (uint256 j = i + 1; j < _signers.length; j++) {
                require(_signers[i] != _signers[j], "Duplicate signer");
            }
        }

        // Create proxy
        bytes memory initData = abi.encodeWithSelector(
            AAAccount.initialize.selector,
            _signers,
            _owner
        );

        ERC1967Proxy proxy = new ERC1967Proxy{salt: _salt}(implementation, initData);
        accountAddress = address(proxy);

        // Track account
        ownerAccounts[_owner].push(accountAddress);
        isValidAccount[accountAddress] = true;

        emit AAAccountCreated(accountAddress, _owner, _signers, block.timestamp);
    }

    /**
     * @notice Create AA account with deterministic address
     * @dev Uses factory address, owner, and salt for deterministic creation
     */
    function getAccountAddress(
        address[] calldata _signers,
        address _owner,
        bytes32 _salt
    ) external view returns (address predictedAddress) {
        // This is a simplified prediction - actual address calculation depends on EVM
        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(implementation, abi.encodeWithSelector(
                AAAccount.initialize.selector,
                _signers,
                _owner
            ))
        );

        predictedAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            _salt,
                            keccak256(bytecode)
                        )
                    )
                )
            )
        );
    }

    /**
     * @notice Get all accounts created for an owner
     * @param _owner Address of the owner
     * @return Array of account addresses
     */
    function getOwnerAccounts(address _owner) external view returns (address[] memory) {
        return ownerAccounts[_owner];
    }

    /**
     * @notice Get account count for owner
     * @param _owner Address of the owner
     * @return Number of accounts created
     */
    function getOwnerAccountCount(address _owner) external view returns (uint256) {
        return ownerAccounts[_owner].length;
    }

    // =============================================================================
    // IMPLEMENTATION MANAGEMENT
    // =============================================================================

    /**
     * @notice Update the implementation contract
     * @param _newImplementation Address of new implementation
     * @dev Only callable via governance (to be added in future)
     */
    function updateImplementation(address _newImplementation) external {
        // TODO: Add access control (e.g., Ownable, governance)
        require(_newImplementation != address(0), "Invalid implementation address");
        implementation = _newImplementation;
        emit ImplementationUpdated(_newImplementation);
    }

    // =============================================================================
    // QUERY FUNCTIONS
    // =============================================================================

    /**
     * @notice Verify if address is a valid AA account created by this factory
     * @param _account Address to check
     * @return bool True if valid AA account
     */
    function isAAAccount(address _account) external view returns (bool) {
        return isValidAccount[_account];
    }
}