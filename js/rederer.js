class Renderer {
  constructor(root){
    // undo btn
    this.undoBtn = document.createElement('button');
    this.undoBtn.textContent = 'Undo'
    this.undoBtn.addEventListener('click',e =>{
      this.undo();
    },false)
    root.appendChild(this.undoBtn)
    // canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = CONSTANTS.WIDTH + CONSTANTS.PADDING * 2;
    this.canvas.height = CONSTANTS.HEIGHT + CONSTANTS.PADDING * 2;
    root.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.lineWidth = 2;
    this.lastTimeStamp = 0;
    this.requestAnimationFrameRef = null;
    this.canvas.addEventListener("click", this.clickHandler.bind(this), false);

    this.waitingForAiMove = false;
    this.game = new Game();
    this.worker = new Worker('js/minimax.js');
    this.worker.onmessage = e =>{
      // if(game.cancledAiPlayId === e.data.id){
      //   game.cancledAiPlayId = 0;
      //   return;
      // }
      // if(!game.paused){
      this.game.makeAIMove(e.data);
      this.waitingForAiMove = false;
      // }
      // this.game aiIsPlaying = false;
    }
    this.moveIndexAnimated = 0;
    this.currentFrame = 0;
  }

  undo(){
    this.waitingForAiMove = false;
    this.game.undo();
  }

  run(){
    this.animate(0);
  }

  stop(){
    cancelAnimationFrame(this.requestAnimationFrameRef);
  }
  // let lastTimeStamp = 0;
  animate(time) {
    if(time - this.lastTimeStamp > 60){
      this.draw();
      // if(renderer.paused && pauseBtn.textContent !== 'continue'){
      //   pauseBtn.textContent = 'continue';
      // }else if(!renderer.paused && pauseBtn.textContent !== 'pause'){
      //   pauseBtn.textContent = 'pause';
      // }
      this.lastTimeStamp =  time;
      this.requestAnimationFrameRef = requestAnimationFrame(this.animate.bind(this))
      // if(renderer.aiPlayers[renderer.turn] && !aiIsPlaying && !renderer.paused){
      //   aiIsPlaying = true;
      //   setTimeout(() => {
      //     aiPlay(renderer.turn,renderer.board.board);
      //   }, 100);
      // }
    }else{
      this.requestAnimationFrameRef = requestAnimationFrame(this.animate.bind(this))
    }
  }

  clickHandler(e){
    if(this.game.paused) return;
    const rect = this.canvas.getBoundingClientRect()
  
    const HALO = 10;
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const realY = relY - CONSTANTS.PADDING + CONSTANTS.RADIUS + HALO;
    const realX = relX - CONSTANTS.PADDING + CONSTANTS.RADIUS + HALO;
    const row = Math.floor(realY / CONSTANTS.SQUARE_SIZE);
    const col = Math.floor(realX / CONSTANTS.SQUARE_SIZE);
  
    const rowPos = realY - row * CONSTANTS.SQUARE_SIZE;
    const colPos = realX - col * CONSTANTS.SQUARE_SIZE;
    if(rowPos < 2 * (CONSTANTS.RADIUS + HALO) && colPos < 2 * (CONSTANTS.RADIUS + HALO)){
      if(e.altKey){ // for debug
        this.game.board.remove([{row,col}]);
        return false;
      }
      if(e.ctrlKey){ // for debug
        if(e.shiftKey){
          this.game.board.board[row][col] = CONSTANTS.SECONDPLAYER;
        }else{
          this.game.board.board[row][col] = CONSTANTS.FIRSTPLAYER;
        }
        return false;
      }
      if(!this.game.winner())
        this.game.select({row,col});
    }
  }

  clearCanvas(){
    this.ctx.clearRect(
      0,
      0,
      CONSTANTS.WIDTH + CONSTANTS.PADDING * 2,
      CONSTANTS.HEIGHT + CONSTANTS.PADDING * 2
    );
  }

  draw(){
    this.clearCanvas();
    const winner = this.game.winner();
    if(winner){
      this.drawWinner(winner);
    }else if(this.moveIndexAnimated === this.game.histo.length-1){
      this.drawFrame();
    } else {
      this.drawBoardAndPieces();
      this._highlightSelected();
      this._highlightMovablePieces();
      this._drawValidMoves();
      if(this.game.aiShouldPlay && !this.waitingForAiMove){
        this.getAiPlaying()
      }
    }
  }

  drawFrame(){
    const move = this.game.histo[this.game.histo.length - 1];
    const step = Math.floor(this.currentFrame / CONSTANTS.FRAMESPERMOVE);

    if(step >= move.listVisited.length){ // animation ended
      this.currentFrame = 0;
      this.moveIndexAnimated++;
      this.drawBoardAndPieces();
      return;
    }
    const board = this.game.board.cloneBoard();
    const value = board[move.to.row][move.to.col];
    board[move.to.row][move.to.col] = 0;
    let len = move.listCaptured.length;
    while (--len>step) {
      const jumped = move.listCaptured[len];
      board[jumped.row][jumped.col] = jumped.value;
    }
    this.drawBoardAndPieces(board);

    const from = step? move.listVisited[step-1] : move.from;
    const to = move.listVisited[step];
    const progress = this.currentFrame % CONSTANTS.FRAMESPERMOVE / CONSTANTS.FRAMESPERMOVE;
    if(move.listCaptured.length){
      this.drawCollectedPiece(move.listCaptured[step],progress);
    }
    this.drawAnimatedPiece(from,to,value,progress);
    this.currentFrame++;
  }

  drawCollectedPiece(pos,progress){
    this.ctx.save();

    this.ctx.fillStyle = CONSTANTS.COLORS[this.game.board.getPlayer(pos.value)];
    this.ctx.beginPath();
    this.ctx.arc(
      CONSTANTS.PADDING + pos.col * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.PADDING + pos.row * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.RADIUS * (1-progress),
      0,
      2 * Math.PI,
      undefined
    );
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    if (Math.abs(pos.value) === 1.1) {
      this.ctx.beginPath();
      this.ctx.arc(
        CONSTANTS.PADDING + pos.col * CONSTANTS.SQUARE_SIZE,
        CONSTANTS.PADDING + pos.row * CONSTANTS.SQUARE_SIZE,
        (CONSTANTS.RADIUS - 5)  * (1-progress),
        0,
        2 * Math.PI,
        undefined
      );
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawAnimatedPiece(from,to,value,progress) {

    this.ctx.save();

    this.ctx.fillStyle = CONSTANTS.COLORS[this.game.board.getPlayer(value)];
    this.ctx.beginPath();
    this.ctx.arc(
      CONSTANTS.PADDING + (from.col + (to.col - from.col) *progress) * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.PADDING + (from.row + (to.row - from.row) * progress) * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.RADIUS,
      0,
      2 * Math.PI,
      undefined
    );
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    if (Math.abs(value) === 1.1) {
      this.ctx.beginPath();
      this.ctx.arc(
        CONSTANTS.PADDING + (from.col + (to.col - from.col)*progress) * CONSTANTS.SQUARE_SIZE,
        CONSTANTS.PADDING + (from.row + (to.row - from.row)*progress) * CONSTANTS.SQUARE_SIZE,
        CONSTANTS.RADIUS - 5,
        0,
        2 * Math.PI,
        undefined
      );
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  getAiPlaying(){
    this.worker.postMessage({ id:++this.game.aiPlayId, player:this.game.turn, board:this.game.board.board});
    this.waitingForAiMove = true;
  }

  drawBoardAndPieces(board = this.game.board.board) {
    this._drawBoard(this.ctx);
    board.forEach((rowList, row) => {
      rowList.forEach((pieceValue, col) => {
        this.game.board.isPiece(pieceValue) && this.drawPiece({ row, col,value:pieceValue });
      });
    });
  }

  drawWinner(winner){
    this.ctx.save();
    this.ctx.fillStyle = CONSTANTS.HIGHLIGHTCOLOR;
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.fillStyle = CONSTANTS.COLORS[winner];
    this.ctx.fillRect(this.canvas.width/4,this.canvas.height/2+5,20,20)
    this.ctx.fillStyle = 'black';
    this.ctx.fillText('WON',this.canvas.width/4 + 40,this.canvas.height/2 + 20)
    this.ctx.restore();
  }

  _drawBoard() {
    this.ctx.save();
    // draw horizantal lines
    for (let i = 0; i < CONSTANTS.ITER + 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH,
        CONSTANTS.PADDING
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH,
        CONSTANTS.PADDING + CONSTANTS.HEIGHT
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
    // draw vertical lines
    for (let i = 0; i < CONSTANTS.ITER + 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING,
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + CONSTANTS.WIDTH,
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
    // draw diagonals lines
    for (let i = 1; i < CONSTANTS.ITER + 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING,
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH,
        CONSTANTS.PADDING
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
    for (let i = 1; i < CONSTANTS.ITER; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH,
        CONSTANTS.PADDING + CONSTANTS.WIDTH
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + CONSTANTS.WIDTH,
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
    for (let i = 0; i < CONSTANTS.ITER + 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING,
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + CONSTANTS.WIDTH - i * CONSTANTS.CELLWIDTH,
        CONSTANTS.PADDING + CONSTANTS.WIDTH
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
    for (let i = 1; i < CONSTANTS.ITER; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH,
        CONSTANTS.PADDING
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + CONSTANTS.WIDTH,
        CONSTANTS.PADDING + CONSTANTS.WIDTH - i * CONSTANTS.CELLWIDTH
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawPiece(pos) {
    const pieceValue = pos.value || this.game.board.getPieceValue(pos);
    if (!this.game.board.isPiece(pieceValue)) return;
    this.ctx.save();

    this.ctx.fillStyle = CONSTANTS.COLORS[this.game.board.getPlayer(pieceValue)];
    this.ctx.beginPath();
    this.ctx.arc(
      CONSTANTS.PADDING + pos.col * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.PADDING + pos.row * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.RADIUS,
      0,
      2 * Math.PI,
      undefined
    );
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    if (Math.abs(pieceValue) === 1.1) {
      this.ctx.beginPath();
      this.ctx.arc(
        CONSTANTS.PADDING + pos.col * CONSTANTS.SQUARE_SIZE,
        CONSTANTS.PADDING + pos.row * CONSTANTS.SQUARE_SIZE,
        CONSTANTS.RADIUS - 5,
        0,
        2 * Math.PI,
        undefined
      );
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  _highlightSelected(){
    if(this.game.selected){
      this.highlightPiece(this.game.selected)
    }
  }

  highlightPiece(pos) {
    if (this.game.board.isPiece(this.game.board.getPieceValue(pos))) {
      this.ctx.save();
      this.ctx.fillStyle = CONSTANTS.HIGHLIGHTCOLOR;
      this.ctx.beginPath();
      this.ctx.arc(
        CONSTANTS.PADDING + pos.col * CONSTANTS.SQUARE_SIZE,
        CONSTANTS.PADDING + pos.row * CONSTANTS.SQUARE_SIZE,
        CONSTANTS.RADIUS,
        0,
        2 * Math.PI,
        undefined
      );
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  _highlightMovablePieces(){
    this.ctx.save();
    for (const key of this.game.allMovablePiecesMoves.keys()) {
      const [col,row] = key.split(',');
      this.ctx.strokeStyle = CONSTANTS.VALIDMOVECOLOR;
      this.ctx.beginPath();
      this.ctx.arc(CONSTANTS.PADDING + row * CONSTANTS.SQUARE_SIZE,CONSTANTS.PADDING + col*CONSTANTS.SQUARE_SIZE,CONSTANTS.RADIUS,0,2 * Math.PI,undefined);
      this.ctx.closePath()
      this.ctx.stroke();
    } 
    this.ctx.restore();
  }

  _drawValidMoves(){
    if(!this.game.selected) return;
    const {row,col} = this.game.selected;
    const validMoves = this.game.allMovablePiecesMoves.get(`${row},${col}`);
    if(validMoves && validMoves.length){
      this.ctx.save();
      validMoves.forEach(move =>{
        
        this.ctx.fillStyle = CONSTANTS.VALIDMOVECOLOR;
        this.ctx.beginPath();
        this.ctx.arc(CONSTANTS.PADDING + move.to.col * CONSTANTS.SQUARE_SIZE,CONSTANTS.PADDING + move.to.row*CONSTANTS.SQUARE_SIZE,CONSTANTS.VALIDMOVERADIUS,0,2 * Math.PI,undefined);
        this.ctx.closePath()
        this.ctx.fill();
      });
      this.ctx.restore();
    }
  }
}
