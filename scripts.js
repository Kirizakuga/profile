const  decreaseBtn = document.getElementById('decrease');
const  resetBtn = document.getElementById('reset');
const  increaseBtn = document.getElementById('increase');
const counterLabel = document.getElementById('counterLabel');

let counter = 0;

increaseBtn.onclick = function(){
    counter++;
    counterLabel.textContent = counter;
}

decreaseBtn.onclick = function(){
    counter--;
    counterLabel.textContent = counter;
}

resetBtn.onclick = function(){
    counter = 0;
    counterLabel.textContent = counter;
}
