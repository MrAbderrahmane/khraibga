class Game{
  constructor(){
    this.histo = [];
    this.aiPlayId = 0;
    this.cancledAiPlayId=0
    this.aiPlayers = {[CONSTANTS.FIRSTPLAYER]:false,[CONSTANTS.SECONDPLAYER]:true};

    this._init()
  }

  _init(){
    this.selected = null;
    this.board = new Board()
    this.turn = CONSTANTS.SECONDPLAYER;
    this.paused = false;
    
    this.saveHisto({board:this.board.board});
    this.changeTurn();
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
      
    }else{
      this.allMovablePiecesMoves = this.getMovablePieces(this.turn);
    }
    this.selected = null;
  }

  makeAIMove(move){
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
    this.histo.push(tempMove);
  }
  undo(){
    // this.paused = true;
    if(this.histo.length>1){
      this.cancledAiPlayId = this.aiPlayId;
      this.paused = true;
      this.histo.pop();
      const currentMove = this.histo[this.histo.length - 1];
      this.board.board = this.board.cloneBoard(currentMove.board);
      this.selected = null;
      this.turn = -this.turn;
      this.allMovablePiecesMoves = this.aiPlayers[this.turn]? new Map() : this.getMovablePieces(CONSTANTS.FIRSTPLAYER);
      setTimeout(() => {
        this.paused = false;
      }, 1000);
    }    
  }
}