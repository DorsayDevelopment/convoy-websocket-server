class Event {
  constructor(type) {
    this._type = type;
  }
  
  get type() {
    return this._type;
  }
}

class Connect extends Event {
  constructor(userID) {
    super('connect');
    this.userID = userID;
  }
}


class Disconnect {}
class GroupJoin {}
class GroupLeave {}

module.exports = {
  Connect, Disconnect, GroupJoin, GroupLeave
};
