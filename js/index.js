const pauseBtn = document.querySelector('#pause');
// let aiIsPlaying = false;

const renderer = new Renderer();
let lastTimeStamp = 0;
function animate(time) {
  if(time - lastTimeStamp > 60){
    renderer.draw();
    // if(renderer.paused && pauseBtn.textContent !== 'continue'){
    //   pauseBtn.textContent = 'continue';
    // }else if(!renderer.paused && pauseBtn.textContent !== 'pause'){
    //   pauseBtn.textContent = 'pause';
    // }
    lastTimeStamp =  time;
    requestAnimationFrame(animate)
    // if(renderer.aiPlayers[renderer.turn] && !aiIsPlaying && !renderer.paused){
    //   aiIsPlaying = true;
    //   setTimeout(() => {
    //     aiPlay(renderer.turn,renderer.board.board);
    //   }, 100);
    // }
  }else{
    requestAnimationFrame(animate)
  }
}
animate(0);
