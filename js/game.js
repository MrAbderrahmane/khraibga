class Game{
  constructor(){
    this.histo = [];
    this.aiPlayId = 0;
    this.aiPlayers = {[CONSTANTS.FIRSTPLAYER]:false,[CONSTANTS.SECONDPLAYER]:true};
    this.aiShouldPlay = false;
    this._init()
  }

  _init(){
    this.selected = null;
    this.board = new Board()
    this.turn = CONSTANTS.FIRSTPLAYER;
    this.allMovablePiecesMoves = this.getMovablePieces(this.turn);
  }

  reset(){
    this._init()
  }

  select(pos){
    if (this.selected){
      const result = this._move(this.selected, pos);
      
      if (!result){
        this.selected = null;
        this.select(pos);
      }
      return false;
    }
        
    const pieceValue = this.board.getPieceValue(pos);
    if (this.board.isPiece(pieceValue) && this.board.getPlayer(pieceValue) === this.turn){
      this.selected = pos;
      return true;
    }
        
    return false;
  }

  _move(from,to){
    const validMoves = this.allMovablePiecesMoves.get(`${from.row},${from.col}`);
    if(!validMoves || !validMoves.length) return false;
    const validMove = validMoves.find(m => this.board.isEqualPosition(m.from,from) && this.board.isEqualPosition(m.to,to));

    if (this.selected && validMove) {
      this.board.move(from, to);
      

      if (validMove.listCaptured.length){
        this.board.remove(validMove.listCaptured)
      }
      this.saveHisto(validMove);
      this.changeTurn();
      return true;
    } 
    return false;
  }

  getMovablePieces(player){
    return this.board.getMovablePiecesAndTheirValidMoves(player);
  }

  changeTurn(){
    if(this.turn === CONSTANTS.FIRSTPLAYER){
      this.turn = CONSTANTS.SECONDPLAYER;
      
      
    } else {
      this.turn = CONSTANTS.FIRSTPLAYER;
    }
    if(this.aiPlayers[this.turn]){
      this.allMovablePiecesMoves = new Map();
      this.aiShouldPlay = true;
    }else{
      this.aiShouldPlay = false;
      this.allMovablePiecesMoves = this.getMovablePieces(this.turn);
    }
    this.selected = null;
  }

  makeAIMove(data){
    const {id,player,move} = data;
    if(id !== this.aiPlayId || player !== this.turn) return;
    this.board.board = move.board;
    this.saveHisto(move);
    this.changeTurn();
  }

  winner(){
    return this.board.winner();
  }

  saveHisto(move){
    const tempMove = new Move({...move.from},{...move.to},this.board.cloneBoard(move.board));
    move.listCaptured && (tempMove.listCaptured = [...move.listCaptured])
    move.listVisited && (tempMove.listVisited = [...move.listVisited])
    const boardBefore = this.histo[this.histo.length - 1]?.board || new Board().board;
    this.lastMove = {
      ...tempMove,
      undo:false,
      boardBefore: this.board.cloneBoard(boardBefore),
      startValue:this.board.getPieceValue(move.from,boardBefore),
      endValue:this.board.getPieceValue(move.to),
      shouldBeAnimated: true
    };
    this.histo.push(tempMove);
  }

  undo(){
    const lastMove = this.histo.pop();
    if(!lastMove) return;
    this.aiShouldPlay = false;
    ++this.aiPlayId;
    this.selected = null;
    const boardBefore = this.histo[this.histo.length - 1]?.board || new Board().board;
    this.lastMove = {
      ...lastMove,
      undo:true,
      boardBefore: this.board.cloneBoard(boardBefore),
      startValue:this.board.getPieceValue(lastMove.from,boardBefore),
      endValue:this.board.getPieceValue(lastMove.to,lastMove.board),
      shouldBeAnimated: true
    };
    this.board.board = this.board.cloneBoard(this.histo[this.histo.length - 1]?.board || new Board().board);
    this.turn = -this.turn;
    this.allMovablePiecesMoves = this.aiPlayers[this.turn]? new Map() : this.getMovablePieces(this.turn);
    if(this.aiPlayers[this.turn]){
      setTimeout(() => {
        if(this.aiPlayers[this.turn]) this.aiShouldPlay = true;
      }, 1000);
    }
  }
}