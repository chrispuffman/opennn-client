import uuid from 'uuid/v4';

let server_address = 'ws://opennn.psichix.io';

export default class Session {

  static get SERVER() {
    return server_address;
  }

  static set SERVER(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    server_address = value;
  }

  get connected() {
    return this._socket && this._socket.readyState === 1;
  }

  constructor(server = Session.SERVER) {
    const socket = this._socket = new WebSocket(server);
    this._responses = new Map();

    socket.addEventListener('error', event => console.error(error));
    socket.addEventListener('close', event => this.dispose());
    socket.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data);
      const { payload, type } = msg;
      const { _responses } = this;

      if (!!payload && _responses.has(payload)) {
        const { resolve, reject } = _responses.get(payload);

        if (type === 'error') {
          reject(msg.error);
        } else {
          _responses.delete(payload);
          resolve(msg);
        }
      }
    });
  }

  dispose() {
    const { _socket } = this;
    if (!_socket) {
      return;
    }

    this._socket = null;
    this._responses = null;
    _socket.close();
  }

  ready() {
    return new Promise((resolve, reject) => {
      const { _socket } = this;
      if (!_socket) {
        reject(new Error('There is no socket!'));
        return;
      }
      if (this.connected) {
        resolve(this);
        return;
      }

      const onopen = () => {
        _socket.removeEventListener('open', onopen);
        _socket.removeEventListener('close', onclose);
        resolve(this);
      };
      const onclose = () => {
        _socket.removeEventListener('open', onopen);
        _socket.removeEventListener('close', onclose);
        reject(new Error('Cannot open socket!'));
      };

      _socket.addEventListener('open', onopen);
      _socket.addEventListener('close', onclose);
    });
  }

  createPerceptron(...config) {
    return this.sendQuery({
      type: 'create',
      entity: 'perceptron',
      config
    });
  }

  createLSTM(...config) {
    return this.sendQuery({
      type: 'create',
      entity: 'lstm',
      config
    });
  }

  createLiquid(...config) {
    return this.sendQuery({
      type: 'create',
      entity: 'liquid',
      config
    });
  }

  createTrainer(network) {
    return this.sendQuery({
      type: 'create',
      entity: 'trainer',
      network
    });
  }

  destroyNetwork(id) {
    return this.sendQuery({
      type: 'destroy',
      entity: 'network',
      id
    });
  }

  destroyTrainer(id) {
    return this.sendQuery({
      type: 'destroy',
      entity: 'trainer',
      id
    });
  }

  train(trainer, set, config = undefined, range = undefined) {
    if (Array.isArray(range)) {
      range = {
        from: range[0],
        to: range[1]
      };
    }

    return this.sendQuery({
      type: 'train',
      trainer,
      set,
      config,
      range
    });
  }

  activate(network, set, range = undefined) {
    if (Array.isArray(range)) {
      range = {
        from: range[0],
        to: range[1]
      };
    }

    return this.sendQuery({
      type: 'activate',
      network,
      set,
      range
    });
  }

  activateAll(network, sets, range = undefined) {
    if (Array.isArray(range)) {
      range = {
        from: range[0],
        to: range[1]
      };
    }

    return Promise.all(sets.map(set => this.activate(network, set, range)));
  }

  save(network = undefined) {
    return this.sendQuery({
      type: 'save',
      network
    });
  }

  load(data, network = undefined) {
    return this.sendQuery({
      type: 'load',
      data,
      network
    });
  }

  clearNetworks() {
    return this.sendQuery({
      type: 'clear-networks'
    });
  }

  clearTrainers() {
    return this.sendQuery({
      type: 'clear-trainers'
    });
  }

  clear() {
    return this.sendQuery({
      type: 'clear'
    });
  }

  list() {
    return this.sendQuery({
      type: 'list'
    });
  }

  sendQuery(data) {
    if (!data) {
      return Promise.reject(new Error('`data` cannot be null!'));
    }
    if (!('type' in data)) {
      return Promise.reject(new Error('There is no `data.type` field!'));
    }

    const { _socket } = this;
    if (!_socket || !this.connected) {
      return Promise.reject(new Error('There is no open socket!'));
    }

    return new Promise((resolve, reject) => {
      const payload = uuid();

      this._responses.set(payload, { resolve, reject });
      _socket.send(JSON.stringify({ ...data, payload }));
    });
  }

}
