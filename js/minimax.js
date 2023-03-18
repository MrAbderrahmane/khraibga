importScripts('constants.js' );
importScripts('board.js' );
importScripts('move.js' );


function minimax(move,depth,maxPlayer,alpha,beta,player) {
  let board = move.board;
  if(!(board instanceof Board)){
    board = new Board(board);
  }
  if(depth === 0 || board.winner() !== null){
    const value = board.evaluate(player);
    return [value,move];
  }

  if(maxPlayer){
    let maxEval = -CONSTANTS.INFINITY;
    let bestMove = null;
    const allMoves = getAllMoves(board, player);
    for (const tempMove of allMoves) {
      const evaluation = minimax(tempMove,depth-1,false,alpha,beta,player)[0];
      if(maxEval < evaluation){
        bestMove = tempMove;
      }
      maxEval = Math.max(maxEval,evaluation);
      alpha = Math.max(alpha,evaluation);
      if(beta <= alpha) break;
    }
    return [maxEval,bestMove || allMoves[0]];
  }else{
    let minEval = CONSTANTS.INFINITY;
    let bestMove = null;
    const allMoves = getAllMoves(board, -player);
    for (const tempMove of allMoves) {
      const evaluation = minimax(tempMove,depth-1,true,alpha,beta,player)[0];
      if(minEval > evaluation){
        bestMove = tempMove;
      }
      minEval = Math.min(minEval,evaluation);
      beta = Math.min(beta,evaluation);
      if(beta <= alpha) break;
    }
    return [minEval,bestMove || allMoves[0]];
  }
}

function getAllMoves(board,player,startTime) {
  let allMoves = []
  const pieces = board.getMovablePiecesAndTheirValidMoves(player,startTime);
  for (const moves of pieces.values()) {
    allMoves.push(...moves);
  }
  return allMoves;
}


addEventListener('message',e=>{
  if( e.data.player && e.data.board ){
    const [eval,move] = minimax({board:e.data.board},2*(e.data.level||1),true,-CONSTANTS.INFINITY,+CONSTANTS.INFINITY,e.data.player)
    postMessage({id:e.data.id, move,player:e.data.player});
  }
},false);
