class Renderer {
  constructor(root){
    const controls = document.createElement('div');
    // undo btn
    const undoBtn = document.createElement('button');
    undoBtn.textContent = 'Undo'
    undoBtn.addEventListener('click',e =>{
      this.undo();
    },false)
    controls.appendChild(undoBtn);
    // settings dialog
    const diag = document.createElement('dialog');
    diag.innerHTML = `<form method="dialog">
    <div>
      <button value='true'>Human vs AI</button>
      <input type="range" name="level" min="1" max="3">
    </div>
    <button value=''>Human vs Human</button>
  </form>`;
    diag.addEventListener('close', () => {
      this.level = +diag.querySelector('input').value
      this.newGame();
      this.setAIUser(!!diag.returnValue)
    })
    root.appendChild(diag);
    // new game btn
    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'New'
    newGameBtn.addEventListener('click',e =>{
      this.newGame();
    },false)
    controls.appendChild(newGameBtn)
    // new setting button
    const settingBtn = document.createElement('button');
    settingBtn.textContent = 'Setting';
    settingBtn.addEventListener('click',e =>{
      diag.show();
    },false)
    controls.appendChild(settingBtn);
    root.appendChild(controls);
    // canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = CONSTANTS.WIDTH + CONSTANTS.PADDING * 2;
    this.canvas.height = CONSTANTS.HEIGHT + CONSTANTS.PADDING * 2;
    root.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.lineWidth = 2;
    this.ctx.font = '18px sans-serif'
    this.lastTimeStamp = 0;
    this.requestAnimationFrameRef = null;
    this.canvas.addEventListener("click", this.clickHandler.bind(this), false);

    this.waitingForAiMove = false;
    this.game = new Game();
    this.worker = new Worker('js/minimax.js');
    this.worker.onmessage = e =>{
      this.game.makeAIMove(e.data);
      this.waitingForAiMove = false;
    }
    this.currentFrame = 0;

    new ResizeObserver(entries => {
      entries.forEach(entry => {
        if(entry.target === root){
          const dim = Math.min(entry.contentRect.width,entry.contentRect.height,window.innerWidth,window.innerHeight);
          CONSTANTS.PADDING = dim / 10;
          CONSTANTS.WIDTH = CONSTANTS.HEIGHT = dim - 2 * CONSTANTS.PADDING;
          this.canvas.width = dim;
          this.canvas.height = dim;
          CONSTANTS.CELLWIDTH = CONSTANTS.WIDTH / 2;
          CONSTANTS.SQUARE_SIZE = CONSTANTS.WIDTH / 4;
          CONSTANTS.RADIUS = CONSTANTS.SQUARE_SIZE / 6;
          this.ctx.lineWidth = CONSTANTS.RADIUS * .09;
          CONSTANTS.VALIDMOVERADIUS = CONSTANTS.RADIUS / 2; 
        }
      });
    }).observe(root);
  }

  setAIUser(withAi = false){
    this.game.aiPlayers[CONSTANTS.SECONDPLAYER] = withAi;
  }

  newGame(){
    this.game = new Game();
  }

  undo(){
    this.currentFrame = 0
    this.waitingForAiMove = false;
    this.game.undo();
  }

  run(){
    this.animate(0);
  }

  stop(){
    cancelAnimationFrame(this.requestAnimationFrameRef);
  }

  animate(time) {
    if(time - this.lastTimeStamp > 60){
      this.draw();
      this.lastTimeStamp =  time;
      this.requestAnimationFrameRef = requestAnimationFrame(this.animate.bind(this))
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
    const counts = this.game.board.getPlayersPiecesCount();
    const winner = this.game.board.getWinnerFromCounts(counts);
    if(winner){
      this.drawWinner(winner);
    }else if(this.game.lastMove?.shouldBeAnimated){
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
    const move = this.game.lastMove;
    const step = Math.floor(this.currentFrame / CONSTANTS.FRAMESPERMOVE);

    if(step >= move.listVisited.length){ // animation ended
      this.currentFrame = 0;
      this.drawBoardAndPieces();
      this.game.lastMove.shouldBeAnimated = false;
      return;
    }
    if(move.undo){
      const board = move.board;
      const value = move.startValue;
      board[move.to.row][move.to.col] = 0;

      const from = step? move.listVisited[move.listVisited.length - 1 - step] : move.to;
      const to = move.listVisited[move.listVisited.length - 2 - step] || move.from;
      const progress = this.currentFrame % CONSTANTS.FRAMESPERMOVE / CONSTANTS.FRAMESPERMOVE;
      if(move.listCaptured.length){
        const collectedPiece = move.listCaptured[move.listCaptured.length - 1 - step];
        const toBeAdded = move.listCaptured[move.listCaptured.length - step];
        toBeAdded && (board[toBeAdded.row][toBeAdded.col] = toBeAdded.value)
        this.drawBoardAndPieces(board);
        this.drawCollectedPiece(collectedPiece,progress,true);
      }else{
        this.drawBoardAndPieces(board);
      }
      this.drawAnimatedPiece(from,to,value,progress);
    }else{
      const board = move.boardBefore;
      const value = move.startValue;
      board[move.from.row][move.from.col] = 0;
  
      const from = step? move.listVisited[step-1] : move.from;
      const to = move.listVisited[step];
      const progress = this.currentFrame % CONSTANTS.FRAMESPERMOVE / CONSTANTS.FRAMESPERMOVE;
      if(move.listCaptured.length){
        const collectedPiece = move.listCaptured[step];
        board[collectedPiece.row][collectedPiece.col] = 0;
        this.drawBoardAndPieces(board);
        this.drawCollectedPiece(collectedPiece,progress);
      }else{
        this.drawBoardAndPieces(board);
      }
      this.drawAnimatedPiece(from,to,value,progress);
    }
    this.currentFrame++;
  }

  drawCollectedPiece(pos,progress,grow=false){
    const color = CONSTANTS.COLORS[this.game.board.getPlayer(pos.value)];
    const scale = grow?progress:(1-progress);
    this.drawPiece(pos,color,scale,true);
  }

  drawAnimatedPiece(from,to,value,progress) {
    const color = CONSTANTS.COLORS[this.game.board.getPlayer(value)];
    const calcPos = {
      row: from.row + (to.row - from.row) * progress,
      col: from.col + (to.col - from.col) *progress,
      value
    }
    this.drawPiece(calcPos,color,1,true);
  }

  getAiPlaying(){
    this.worker.postMessage({ id:++this.game.aiPlayId, player:this.game.turn, board:this.game.board.board,level:this.level || 1});
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
    this.drawPiece({row:2,col:1},CONSTANTS.COLORS[winner],2,true);
    this.ctx.fillStyle = 'black';
    this.ctx.font = `${CONSTANTS.SQUARE_SIZE}px sans-serif`
    this.ctx.fillText(
      'WON',
      CONSTANTS.PADDING + 1 * CONSTANTS.SQUARE_SIZE + CONSTANTS.RADIUS * 2,
      CONSTANTS.PADDING + 2 * CONSTANTS.SQUARE_SIZE + CONSTANTS.RADIUS * 2
      )
    this.ctx.restore();
  }

  _drawBoard() {
    this.ctx.save();
    // draw horizantal lines
    for (let i = 0; i < CONSTANTS.ITER * 2 + 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH / 2,
        CONSTANTS.PADDING
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH / 2,
        CONSTANTS.PADDING + CONSTANTS.HEIGHT
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
    // draw vertical lines
    for (let i = 0; i < CONSTANTS.ITER * 2 + 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        CONSTANTS.PADDING,
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH / 2
      );
      this.ctx.lineTo(
        CONSTANTS.PADDING + CONSTANTS.WIDTH,
        CONSTANTS.PADDING + i * CONSTANTS.CELLWIDTH / 2
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

  drawPiece(pos,color,scale = 1,force=false) {
    const pieceValue = pos.value || (force? undefined : this.game.board.getPieceValue(pos));
    color = color || CONSTANTS.COLORS[this.game.board.getPlayer(pieceValue)];
    if (!force && !this.game.board.isPiece(pieceValue)) return;
    this.ctx.save();

    this.ctx.fillStyle = color
    this.ctx.beginPath();
    this.ctx.arc(
      CONSTANTS.PADDING + pos.col * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.PADDING + pos.row * CONSTANTS.SQUARE_SIZE,
      CONSTANTS.RADIUS * scale,
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
        (CONSTANTS.RADIUS - 5) * scale,
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
      this.ctx.arc(CONSTANTS.PADDING + row * CONSTANTS.SQUARE_SIZE,CONSTANTS.PADDING + col*CONSTANTS.SQUARE_SIZE,CONSTANTS.RADIUS * 1.2,0,2 * Math.PI,undefined);
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
