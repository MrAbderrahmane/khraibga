class Move {
  constructor(from,to,board){
    this.listVisited = [];
    this.listCaptured = [];
    this.from = from;
    this.to = to;
    this.board = board;
    this.lastDirection = {
      row: Math.sign(to.row - from.row),
      col: Math.sign(to.col - from.col)
    };
  }

  static from(Move){
    const move = new Move(move.from,move.to,move.board);
    this.listVisited = [...from.listVisited];
    this.listCaptured = [...from.listCaptured];
    return move;
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