const CONSTANTS = {
  WIDTH: 400, 
  HEIGHT: 400,
  ROWS: 4, 
  COLS: 4,
  PADDING: 50,
  RADIUS: 10,
  VALIDMOVERADIUS: 4, 
  ITER: 2,

  FIRSTPLAYER: 1,
  FIRSTPLAYERKING: 1.1,
  SECONDPLAYER: -1,
  SECONDPLAYERKING: -1.1,
  FIRSTPLAYERCOLOR: 'rgb(255, 0, 0)',
  SECONDPLAYERCOLOR: 'rgb(255, 255, 255)',
  HIGHLIGHTCOLOR: 'rgba(128, 128, 128, .5)',
  VALIDMOVECOLOR: 'green',

  COLORS: {
    [this.FIRSTPLAYER]:this.FIRSTPLAYERCOLOR,
    [this.SECONDPLAYER]:this.SECONDPLAYERCOLOR
  },

  ALLNEIBOURS: [
    {row:-1,col:0}, // 0 up
    {row:-1,col:1}, // 1 up right
    {row:0,col:1},  // 2 right
    {row:1,col:1},  // 3 down right
    {row:1,col:0},  // 4 down
    {row:1,col:-1}, // 5 down left
    {row:0,col:-1}, // 6 left
    {row:-1,col:-1},// 7 up left
  ],


  PIECECOAFFICIENT: 1,
  KINGBONUSCOAFFICIENT: 10,

  AITIMELIMIT: 60 * 1000,
}
CONSTANTS.SQUARE_SIZE = CONSTANTS.WIDTH / 4;
CONSTANTS.CELLWIDTH = CONSTANTS.WIDTH / 2;
CONSTANTS.COLORS = {
  [CONSTANTS.FIRSTPLAYER]:CONSTANTS.FIRSTPLAYERCOLOR,
  [CONSTANTS.SECONDPLAYER]:CONSTANTS.SECONDPLAYERCOLOR
};
