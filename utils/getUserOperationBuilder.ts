import { BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { UserOperationBuilder } from "userop";

export const getUserOperationBuilder = (
  walletContract: string,
  nonce: BigNumber,
  initCode: Uint8Array,
  encodedCallData: string,
  signatures: string[]
) => {
  try {
    const encodedSignatures = defaultAbiCoder.encode(["bytes[]"], [signatures]);
    const userOpBuilder = new UserOperationBuilder()
      .useDefaults({
        preVerificationGas: 100_000,
        callGasLimit: 100_000,
        verificationGasLimit: 100_000,
      })
      .setNonce(nonce)
      .setSender(walletContract)
      .setCallData(encodedCallData)
      .setInitCode(initCode)
      .setSignature(encodedSignatures);
    return userOpBuilder;
  } catch (error) {
    console.error(error);
    throw error;
  }
};