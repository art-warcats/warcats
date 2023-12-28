import {CosmWasmClient} from 'cosmwasm';

export const contract =
  'stars14s5myt0x09unqgkn5jqcu4evg82xr6q57dw0xu2dhnjuk0q3lazshr7hvj';

export const getWarCatTokenIds = async (owner: string) => {
  const client = await CosmWasmClient.connect('https://rpc.stargaze-apis.com/');

  const nfts = await client.queryContractSmart(contract, {
    tokens: {owner},
  });

  return nfts.tokens as number[];
};
