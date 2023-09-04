// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {BaseAccount} from "account-abstraction/core/BaseAccount.sol";
import {UserOperation} from "account-abstraction/interfaces/UserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {TokenCallbackHandler} from "account-abstraction/samples/callback/TokenCallbackHandler.sol";

contract Wallet is BaseAccount, Initializable, UUPSUpgradeable, TokenCallbackHandler {
  using ECDSA for bytes32;

  address public immutable walletFactory;
  IEntryPoint private immutable _entryPoint;
  address[] public owners;

  event WalletInitialized(IEntryPoint indexed entryPoint, address[] owners);

  modifier _requireFromEntryPointOrFactory() {
    require(
      msg.sender == address(_entryPoint) || msg.sender == walletFactory,
      "only entry point or wallet factory can call"
    );
    _;
  }

  constructor(IEntryPoint entryPoint_, address walletFactory_) {
    walletFactory = walletFactory_;
    _entryPoint = entryPoint_;
  }

  function _authorizeUpgrade(address) internal view override _requireFromEntryPointOrFactory() {}

  function initialize(address[] memory initialOwners) public initializer {
    _initialize(initialOwners);
  }

  function _initialize(address[] memory initialOwners) internal {
    require(initialOwners.length > 0, "no owners");
    owners = initialOwners;
    emit WalletInitialized(_entryPoint, initialOwners);
  }
  
  function entryPoint() public view override returns (IEntryPoint) {
    return _entryPoint;
  }

// https://docs.openzeppelin.com/contracts/2.x/api/cryptography#ECDSA
  function _validateSignature(
    UserOperation calldata userOp,
    bytes32 userOpHash
  ) internal view override returns (uint256) {
    //Returns an Ethereum Signed Message, just like eth_sign in JSON-RPC, when use create an operation, evm will do the same for usesrOpHash.
    bytes32 hash = userOpHash.toEthSignedMessageHash();
    bytes[] memory signature = abi.decode(userOp.signature, (bytes[]));

    for (uint256 i = 0; i < owners.length; i++) {
      // Returns the address that signed a hashed message (hash) with signature, only for validation
      if (hash.recover(signature[i]) != owners[i]) {
        return SIG_VALIDATION_FAILED;
      }
    }
    return 0;
  }

  function _call(address target, uint256 value, bytes memory data) internal {
    (bool success, bytes memory result) = target.call{value: value}(data);
    if (!success) {
        assembly {
            // The assembly code here skips the first 32 bytes of the result, which contains the length of data.
            // It then loads the actual error message using mload and calls revert with this error message.
            revert(add(result, 32), mload(result))
        }
    }
  }

  function execute(
    address dest,
    uint256 value,
    bytes calldata func
  ) external _requireFromEntryPointOrFactory() {
    _call(dest, value, func);
  }

  function executeBatch(
    address[] calldata dests,
    uint256[] calldata values,
    bytes[] calldata funcs
  ) external _requireFromEntryPointOrFactory() {
    require(
      dests.length == values.length && dests.length == funcs.length,
      "invalid input"
    );
    for (uint256 i = 0; i < dests.length; i++) {
      _call(dests[i], values[i], funcs[i]);
    }
  }

  function encodeSignatures(
    bytes[] memory signatures
  ) public pure returns (bytes memory) {
    return abi.encode(signatures);
  }

  function getDeposit() public view returns (uint256) {
    return entryPoint().balanceOf(address(this));
  }

  function addDeposit() public payable {
    entryPoint().depositTo{value: msg.value}(address(this));
  }

  receive() external payable {}
}