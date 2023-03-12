class Board {
  constructor(board) {
    if (board) {
      this.board = board;
    } else {
      this.createBoard();
    }
  }

  createBoard() {
    this.board = [];
    for (let i = 0; i < CONSTANTS.ROWS + 1; i++) {
      this.board.push([]);
      for (let j = 0; j < CONSTANTS.ROWS + 1; j++) {
        if (i < 2) {
          this.board[i].push(CONSTANTS.SECONDPLAYER);
        } else if (i === 2) {
          if (j < 2) {
            this.board[i].push(CONSTANTS.SECONDPLAYER);
          } else if (j === 2) {
            this.board[i].push(0);
          } else {
            this.board[i].push(CONSTANTS.FIRSTPLAYER);
          }
        } else {
          this.board[i].push(CONSTANTS.FIRSTPLAYER);
        }
      }
    }
  }

  getPlayersPiecesCount() {
    const firstPlayerPieces = this.getAllPieces(CONSTANTS.FIRSTPLAYER);
    const secondPlayerPieces = this.getAllPieces(CONSTANTS.SECONDPLAYER);
    return {
      firstPlayerKingsCount: firstPlayerPieces.filter(
        v => v.value === CONSTANTS.FIRSTPLAYERKING
      ).length,
      secondPlayerKingsCount: secondPlayerPieces.filter(
        v => v.value === CONSTANTS.SECONDPLAYERKING
      ).length,
      firstPlayerAllPiecesCount: firstPlayerPieces.length,
      secondPlayerAllPiecesCount: secondPlayerPieces.length,
    };
  }

  getPlayer(pieceValue) {
    return Math.round(pieceValue);
  }

  isPiece(pieceValue) {
    return pieceValue !== 0;
  }
  getPieceValue(pos, board = this.board) {
    return board[pos.row][pos.col];
  }

  shouldBeCrowned(to, board = this.board) {
    return (
      (
        board[to.row][to.col] === CONSTANTS.SECONDPLAYER && 
        (this.isEqualPosition(to,{row:4,col:0}) || this.isEqualPosition(to,{row:4,col:4}))
      )
      ||
      (
        board[to.row][to.col] === CONSTANTS.FIRSTPLAYER && 
        (this.isEqualPosition(to,{row:0,col:0}) || this.isEqualPosition(to,{row:0,col:4}))
      )
    )
  }
  isKing(pieceValue) {
    return Math.abs(pieceValue) === 1.1;
  }
  makeKing(pos, board = this.board) {
    board[pos.row][pos.col] = Math.sign(board[pos.row][pos.col]) * 1.1;
  }
  swap(from, to, board = this.board) {
    [board[from.row][from.col], board[to.row][to.col]] = [
      board[to.row][to.col],
      board[from.row][from.col],
    ];
  }
  move(from, to, board = this.board) {
    this.swap(from, to, board);

    if (this.shouldBeCrowned(to, board)) {
      this.makeKing(to, board);
    }
  }

  remove(pieces, board = this.board) {
    const player = this.getPlayer(this.getPieceValue(pieces[0],board));
    for (const piece of pieces) {
      board[piece.row][piece.col] = 0;
    }
    const allPlayerPieces = this.getAllPieces(player,board);
    if(allPlayerPieces.length === 1){
      const lastPiece = allPlayerPieces[0];
      board[lastPiece.row][lastPiece.col] = player * 1.1;
    }
  }

  isInStrait(pos) {
    if (
      (pos.row % 2 === 0 && pos.col % 2 === 1) ||
      (pos.row % 2 === 1 && pos.col % 2 === 0)
    ) {
      return true;
    }
    return false;
  }
  isTheirOpponentNeighbour(pos, direction, board = this.board) {
    const computedRow = pos.row + direction.row;
    const computedCol = pos.col + direction.col;
    if (this.isOutOfBound(computedRow) || this.isOutOfBound(computedCol))
      return false;
    const neighbour = this.getPieceValue(
      { row: computedRow, col: computedCol },
      board
    );
    return (
      this.isPiece(neighbour) &&
      this.getPlayer(neighbour) !==
        this.getPlayer(this.getPieceValue(pos, board))
    );
  }
  getDirection(pieceValue) {
    if (!this.isPiece(pieceValue))
      throw new Error("to get direction must provide pieceValue");
    return this.getPlayer(pieceValue) === CONSTANTS.FIRSTPLAYER ? -1 : 1;
  }

  getAllPieces(player,board = this.board) {
    const currPleyer = this.getPlayer(player);
    const pieces = [];
    let iRow = board.length;
    while (iRow--) {
      const row = board[iRow];
      let iCol = row.length;
      while (iCol--) {
        const value = row[iCol];
        if (this.getPlayer(value) === currPleyer) {
          pieces.push({ row: iRow, col: iCol, value });
        }
      }
    }
    return pieces;
  }

  makeKingsByMoves(moves) {
    let len = moves.length;
    while (len--) {
      const move = moves[len];
      if (
        this.getPlayer(this.getPieceValue(move.to, move.board)) ===
        CONSTANTS.FIRSTPLAYER
      ) {
        if (this.isEqualPosition(move.to,{row: 0,col:0}) || this.isEqualPosition(move.to,{row: 0,col:4})) {
          this.makeKing(move.to, move.board);
        }
      } else {
        if (this.isEqualPosition(move.to, {row : 4,col:0}) || this.isEqualPosition(move.to, {row : 4,col:4})) {
          this.makeKing(move.to, move.board);
        }
      }
    }
  }

  isOutOfBound(coordinate) {
    return coordinate < 0 || coordinate > CONSTANTS.ROWS;
  }

  isInBound(coordinate) {
    return !this.isOutOfBound(coordinate);
  }

  isDiagonal(direction) {
    return Math.abs(direction.row) === Math.abs(direction.col);
  }

  isEqualPosition(pos1, pos2) {
    return pos1.row === pos2.row && pos1.col === pos2.col;
  }

  cloneBoard(board = this.board) {
    return [
      board[0].slice(),
      board[1].slice(),
      board[2].slice(),
      board[3].slice(),
      board[4].slice()
    ];
  }

  getSingleMove(lastMove, board, pos, direction) {
    if (lastMove && !this.isEqualPosition(lastMove.to, pos)) return null;
    const to = { row: pos.row + direction.row, col: pos.col + direction.col };

    if(this.isOutOfBound(to.row) ||
      this.isOutOfBound(to.col) ||
      this.isPiece(this.getPieceValue(to, board))
    ) return null;

    const cloneBoard = this.cloneBoard(board);
    this.swap(pos, to, cloneBoard);
    let move;
    if (lastMove) {
      move = Move.from(lastMove);
      move.board = cloneBoard;
      move.add(to)
    } else {
      move = new Move(pos, to, cloneBoard);
    }
    return move;
  }

  getSimpleMovesInRow(lastMove, board, pos, direction, lastResult = []) {
    const move = this.getSingleMove(lastMove, board, pos, direction);
    if (move) {
      lastResult.push(move);
      return this.getSimpleMovesInRow(
        move,
        move.board,
        move.to,
        direction,
        lastResult
      );
    } else {
      return lastResult;
    }
  }
  getMovesInRow(lastMove, board, pos, direction) {
    const moves = this.getSimpleMovesInRow(lastMove, board, pos, direction);
    let i = moves.length;
    while (i--) {
      const m = moves[i];
      if (lastMove) {
        // m.from = lastMove.from;
        const lVisited = m.listVisited.slice();
        const last = lVisited.pop();
        lVisited.pop();
        m.listVisited = [...lVisited,last];
      } else {
        m.from = pos;
        m.listVisited = [pos];
      }
    }
    return moves;
  }
  
  getPossibleMoves(lastMove, board, pos) {
    let moves = [];
    const pieceValue = this.getPieceValue(pos, board);
    const direction = this.getDirection(pieceValue);
    const isInStrait = this.isInStrait(pos);
    const isKing = this.isKing(pieceValue);

    const straightMove = this.getSingleMove(lastMove, board, pos, {
      row: direction,
      col: 0,
    });
    if (straightMove) moves.push(straightMove);
    const oppositeStraightMove = this.getSingleMove(lastMove, board, pos, {
      row: -direction,
      col: 0,
    });
    if (oppositeStraightMove) moves.push(oppositeStraightMove);
    const negativeHorizantalMove = this.getSingleMove(lastMove, board, pos, {
      row: 0,
      col: -1,
    });
    if (negativeHorizantalMove) moves.push(negativeHorizantalMove);
    const positiveHorizantalMove = this.getSingleMove(lastMove, board, pos, {
      row: 0,
      col: 1,
    });
    if (positiveHorizantalMove) moves.push(positiveHorizantalMove);


    if (isInStrait && !isKing) {
      return moves;
    }
    if (!isInStrait) {
      const negativeDiagonalMove = this.getSingleMove(lastMove, board, pos, {
        row: direction,
        col: -1,
      });
      if (negativeDiagonalMove) moves.push(negativeDiagonalMove);
      const positiveDiagonalMove = this.getSingleMove(lastMove, board, pos, {
        row: direction,
        col: 1,
      });
      if (positiveDiagonalMove) moves.push(positiveDiagonalMove);
      const oppositeNegativeDiagonalMove = this.getSingleMove(
        lastMove,
        board,
        pos,
        { row: -direction, col: -1 }
      );
      if (oppositeNegativeDiagonalMove)
        moves.push(oppositeNegativeDiagonalMove);
      const oppositePositiveDiagonalMove = this.getSingleMove(
        lastMove,
        board,
        pos,
        { row: -direction, col: 1 }
      );
      if (oppositePositiveDiagonalMove)
        moves.push(oppositePositiveDiagonalMove);

      if (!isKing) return moves;
    }

    let movesInRow = [];
    let len = moves.length;
    while (len--) {
      const move = moves[len];
      const tempMoves = this.getMovesInRow(
        move,
        move.board,
        move.to,
        move.lastDirection
      );
      if (tempMoves && tempMoves.length) movesInRow.push(...tempMoves);
    }
    moves.push(...movesInRow);
    return moves;
  }

  getSinglePossibleJump(lastMove, board, pos, direction) {
    if (lastMove && !this.isEqualPosition(lastMove.to, pos)) return null;
    if (lastMove) board = lastMove.board;
    const to = {
      row: pos.row + 2 * direction.row,
      col: pos.col + 2 * direction.col,
    };
    if (
      this.isOutOfBound(to.row) || 
      this.isOutOfBound(to.col) || 
      this.isPiece(this.getPieceValue(to, board)) ||
      !this.isTheirOpponentNeighbour(pos, direction, board)
    ) {
      return null;
    }

    const isInStrait = this.isInStrait(pos);
    if (isInStrait && this.isDiagonal(direction)) {
      return null;
    }

    const jumped = {
      row: pos.row + direction.row,
      col: pos.col + direction.col
    };
    jumped.value = this.getPieceValue(jumped, board)
    const cloneBoard = this.cloneBoard(board);
    this.swap(pos, to, cloneBoard);
    this.remove([jumped], cloneBoard);

    let move;
    if (lastMove) {
      move = Move.from(lastMove);
      move.board = cloneBoard;
      move.add(to,jumped);
    } else {
      move = new Move(pos, to, cloneBoard,jumped);
    }
    return move;
  }

  getLastSinglePossibleMoveInRow(board, pos, direction, last) {
    const move = this.getSingleMove(null, board, pos, direction);

    if (move) {
      return this.getLastSinglePossibleMoveInRow(
        move.board,
        move.to,
        direction,
        move
      );
    } else if (last) {
      last.from = pos;
      return last;
    }
    return null;
  }
  
  getLastPossibleMoveInRow(board, pos, direction) {
    const move = this.getLastSinglePossibleMoveInRow(board, pos, direction);
    if (!move) return null;
    move.from = pos;
    return move;
  }
  
  getSingleJumpAwayInOneDirection(lastMove, board, pos, direction) {
    const move = this.getLastPossibleMoveInRow(board, pos, direction);
    if (!move) return null;

    const tempMove = this.getSinglePossibleJump(
      null,
      move.board,
      move.to,
      move.lastDirection
    );
    if (!tempMove) return null;

    let result = null;
    if (lastMove) {
      result = Move.from(lastMove);
      result.board = tempMove.board;
      result.listVisited = [...lastMove.listVisited];
      result.listCaptured = [...lastMove.listCaptured, ...tempMove.listCaptured];
      result.add(tempMove.to);
    } else {
      result = tempMove;
      result.from = pos;
    }
    return result;
  }

  getAllJumpAway(lastMove, board, pos) {
    const filteredMoves = [];
    let i = CONSTANTS.ALLNEIBOURS.length;
    while (i--) {
      const result = this.getSingleJumpAwayInOneDirection(
        lastMove,
        board,
        pos,
        CONSTANTS.ALLNEIBOURS[i]
      );
      filteredMoves.push(result);
    }
    return filteredMoves;
  }

  getPossibleSingleJumpsAllDirections(lastMove, board, pos) {
    let moves = [],
      len = CONSTANTS.ALLNEIBOURS.length;
    while (len--) {
      const move = this.getSinglePossibleJump(
        lastMove,
        board,
        pos,
        CONSTANTS.ALLNEIBOURS[len]
      );
      if (move) moves.push(move);
    }
    if (this.isKing(this.getPieceValue(pos, board))) {
      const allJumpAway = this.getAllJumpAway(lastMove, board, pos);
      moves.push(...allJumpAway);
      const possibleMovesAfterJumpInRow = [];
      let i = moves.length;
      while (i--) {
        const mv = moves[i];
        const innerMoves = this.getMovesInRow(
          mv,
          mv.board,
          mv.to,
          mv.lastDirection
        );
        let j = innerMoves.length;
        while (j--) {
          const m = innerMoves[j];
          if (m) possibleMovesAfterJumpInRow.push(m);
        }
      }
      moves.push(...possibleMovesAfterJumpInRow);
    }
    return moves;
  }

  winner() {
    const counts = this.getPlayersPiecesCount();
    if (counts.firstPlayerAllPiecesCount <= 0) return CONSTANTS.SECONDPLAYER;
    else if (counts.secondPlayerAllPiecesCount <= 0)
      return CONSTANTS.FIRSTPLAYER;
    return null;
  }

  evaluate(player) {
    const counts = this.getPlayersPiecesCount();
    if(counts.firstPlayerAllPiecesCount === 0) return player * -CONSTANTS.INFINITY;
    if(counts.secondPlayerAllPiecesCount === 0) return player * CONSTANTS.INFINITY;
    return (
      player *
      (CONSTANTS.PIECECOAFFICIENT *
        (counts.firstPlayerAllPiecesCount -
          counts.secondPlayerAllPiecesCount) +
        CONSTANTS.KINGBONUSCOAFFICIENT *
          (counts.firstPlayerKingsCount - counts.secondPlayerKingsCount))
    );
  }

  addMoveToBestMoves(bestMoves, move) {
    if(bestMoves.length){
      if (bestMoves[0].listCaptured.length < move.listCaptured.length) {
        bestMoves.length = 0;
        bestMoves.push(move);
      }else if (bestMoves[0].listCaptured.length === move.listCaptured.length) {
        bestMoves.push(move);
      }
    } else {
      bestMoves.push(move);
    }
  }

  getValidJumps(pos,startTime, validJumps = [], lastMove = null) {
    if(startTime && Date.now() - startTime >= CONSTANTS.AITIMELIMIT) return validJumps;
    let len = CONSTANTS.ALLNEIBOURS.length;
    const board = lastMove && lastMove.board ? lastMove.board : this.board;
    while (len--) {
      if (this.isKing(this.getPieceValue(pos, board))) {
        let move = this.getSinglePossibleJump(
          lastMove,
          board,
          pos,
          CONSTANTS.ALLNEIBOURS[len]
        );
        move =
          move ||
          this.getSingleJumpAwayInOneDirection(
            lastMove,
            board,
            pos,
            CONSTANTS.ALLNEIBOURS[len]
          );
        if (move) {
          this.addMoveToBestMoves(validJumps, move);
          this.getValidJumps(move.to,startTime, validJumps, move);
          const allMoves = this.getMovesInRow(
            move,
            move.board,
            move.to,
            move.lastDirection
          );
          let j = allMoves.length;
          while (j--) {
            const m = allMoves[j];
            if (m) {
              this.addMoveToBestMoves(validJumps, m);
              this.getValidJumps(m.to,startTime, validJumps, m);
            }
            if(startTime && Date.now() - startTime >= CONSTANTS.AITIMELIMIT) break;
          }
        }
      } else {
        const move = this.getSinglePossibleJump(
          lastMove,
          board,
          pos,
          CONSTANTS.ALLNEIBOURS[len]
        );
        if (move) {
          this.addMoveToBestMoves(validJumps, move);
          this.getValidJumps(move.to,startTime, validJumps, move);
        }
      }
      if(startTime && Date.now() - startTime >= CONSTANTS.AITIMELIMIT) break;
    }
    return validJumps;
  }

  getValidMoves(pos,startTime) {
    if (!this.isPiece(this.getPieceValue(pos)))
      return { maxJump: 0, validMoves: [] };
    /* !  caching
    if (
      Board[
        pos.row.toString() + "-" + pos.col.toString() + this.board.toString()
      ]
    )
      return Board[
        pos.row.toString() + "-" + pos.col.toString() + this.board.toString()
      ];
    */
    
    const possibleJumps = this.getValidJumps(pos,startTime);
    this.makeKingsByMoves(possibleJumps);
    if (possibleJumps.length) {
      return {
        maxJump: possibleJumps[0].listCaptured.length,
        validMoves: possibleJumps,
      };
    }
    const simpleMoves = this.getPossibleMoves(null, this.board, pos);
    this.makeKingsByMoves(simpleMoves);
    const res = {
      maxJump: 0,
      validMoves: simpleMoves
    };
    /* ! caching
    Board[
      pos.row.toString() + "-" + pos.col.toString() + this.board.toString()
    ] = res;
    */
    return res;
  }

  getMovablePiecesAndTheirValidMoves(player,startTime) {
    const allMovablePiecesMoves = new Map();
    const allPieces = this.getAllPieces(player);
    let bestJumpingCount = 0;
    let i = allPieces.length;
    while (i--) {
      const piece = allPieces[i];
      const { maxJump, validMoves: moves } = this.getValidMoves(piece,startTime);
      if (moves.length) {
        bestJumpingCount = Math.max(bestJumpingCount, maxJump);
        allMovablePiecesMoves.set(`${piece.row},${piece.col}`, moves);
      }
      if(startTime && Date.now() - startTime >= CONSTANTS.AITIMELIMIT){
        break;
      }
    }
    if (bestJumpingCount === 0) return allMovablePiecesMoves;
    for (const [key,moves] of allMovablePiecesMoves.entries()) {
      if (moves[0].listCaptured.length < bestJumpingCount) {
        allMovablePiecesMoves.delete(key);
      }
    }
    return allMovablePiecesMoves;
  }
}
