import axios from 'axios';
import {getWarCatTokenIds} from '@warcats/common';
import {makeADR36AminoSignDoc} from '@keplr-wallet/cosmos';

export const getWarCatNfts = async (walletAddress: string) => {
  const nfts = await getWarCatTokenIds(walletAddress);

  const nftMetadatas = await Promise.all(
    nfts.map(async (tokenId) => {
      return await getWarCatMetadata(tokenId);
    }),
  );

  return nftMetadatas;
};

export const getWarCatMetadata = async (tokenId: number) => {
  const response = await axios.get(`/assets/jsons/${tokenId}`);
  console.log('response', response.data);
  return response.data;
};

export interface IWarcatMetadata {
  name: string;
}

export class WalletInfo {
  static instance: WalletInfo | undefined;

  static createInstance(
    wallet: string,
    account: any,
    signer: string,
    signed: string,
    signature: string,
    nfts: IWarcatMetadata[],
  ) {
    WalletInfo.instance = new WalletInfo(
      wallet,
      account,
      signer,
      signed,
      signature,
      nfts,
    );
  }

  static getInstance() {
    return WalletInfo.instance;
  }

  constructor(
    readonly wallet: string,
    readonly account: any,
    readonly signer: string,
    readonly signed: string,
    readonly signature: string,
    readonly nfts: IWarcatMetadata[],
  ) {}
}

export const connectWallet = async () => {
  await (window as any).keplr.enable('stargaze-1');

  const offlineSigner = (window as any).getOfflineSigner('stargaze-1');
  const accounts = await offlineSigner.getAccounts();
  const signDoc = makeADR36AminoSignDoc(accounts[0].address, 'Login');
  const response = await (window as any).keplr.signAmino(
    'stargaze-1',
    accounts[0].address,
    signDoc,
  );

  WalletInfo.createInstance(
    accounts[0].address,
    accounts[0],
    response.signature.pub_key,
    response.signed,
    response.signature.signature,
    await getWarCatNfts(accounts[0].address),
  );
};
