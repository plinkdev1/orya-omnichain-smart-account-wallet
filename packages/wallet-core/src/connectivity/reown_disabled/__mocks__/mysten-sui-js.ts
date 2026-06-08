export class JsonRpcProvider {
  constructor(public readonly endpoint: string = 'https://mock.sui.rpc') {}

  async request(method: string, params: unknown[]): Promise<unknown> {
    return { method, params };
  }
}

export default {
  JsonRpcProvider
};
