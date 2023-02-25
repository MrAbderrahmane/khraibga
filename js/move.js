class Move {
  constructor(from,to,board,jumped=null){
    this.listVisited = [to];
    this.listCaptured = jumped?[jumped]:[];
    this.from = from;
    this.to = to;
    this.board = board;
    this.lastDirection = {
      row: Math.sign(to.row - from.row),
      col: Math.sign(to.col - from.col)
    };
  }

  static from(move){
    const m = new Move(move.from,move.to,move.board);
    m.listVisited = [...move.listVisited];
    m.listCaptured = [...move.listCaptured];
    return m;
  }

  add(to,jumped){
    if(!to) return;
    jumped && this.listCaptured.push(jumped);
    this.listVisited.push(to);
    this.lastDirection = {
      row: Math.sign(to.row - this.to.row),
      col: Math.sign(to.col - this.to.col)
    };
    this.to = to;
  }
}
