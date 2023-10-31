/*

- Исправить возможность разворота на 180 градусов в пределах клетки

- Выбор скорости змейки

*/

// ЗАГРУЗКА ИЗОБРАЖЕНИЙ ...........................................
var apple = new Image();
apple.src = 'assets/Apple2.png';


// ПОЛУЧАЕМ ССЫЛКИ НА HTML ОБЪЕКТЫ ................................
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

var fpsCounter = document.querySelector(".hud #fpsCounter");
var scoreCounter = document.querySelector(".game-header div #scoreCounter");
var recordCounter = document.querySelector(".game-header .hud #recordCounter");

// Пауза
var buttonPause = document.getElementById("pause");
buttonPause.onclick = function () {
    game.pauseIsActive(!game.isPause);
}
var buttonContinue = document.getElementById("continue");
buttonContinue.onclick = function () {
    game.pauseIsActive(false);
}

var gameOverPanel = document.getElementById("game-over");
var buttonRestart = document.getElementById("restart");
buttonRestart.onclick = function () {
    game.startGame();
}

var uagent = navigator.userAgent.toLowerCase();

// ЗАГРУЗКА ДОКУМЕНТА ..........................................
document.addEventListener('DOMContentLoaded', function () {

    if (uagent.search("android") > -1) {
        config.updateConfigForAndroid();         //  Меняем настройки под мобильный телефон
    }
    else {
        // Внутренний размер окна — это ширина и высота области просмотра (вьюпорта).
        console.log(window.innerHeight);

        // Адаптивно меняем размер канваса
        if (window.innerHeight < 600) {
            canvas.height = 304;
        }
        if (window.innerWidth < 544) canvas.width = 448;
        else if (window.innerWidth < 600) canvas.width = 496;
        else if (window.innerWidth < 700) canvas.width = 544;
    }

    document.getElementById("size-map").innerHTML = canvas.width / 16 + "x" + canvas.height / 16

    game.startGame();
    glManager.gameLoop();
});

// ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД ..........................................

var gamepad = document.getElementById("gamepadCont");

var LeftButton = document.getElementById("left");
LeftButton.ontouchstart = function () {
    control.dir = 1;
}

var UpButton = document.getElementById("up");
UpButton.ontouchstart = function () {
    control.dir = 2;
}

var RightButton = document.getElementById("right");
RightButton.ontouchstart = function () {
    control.dir = 3;
}

var DownButton = document.getElementById("down");
DownButton.ontouchstart = function () {
    control.dir = 4;
}

// Отлавливаев клики мышкой
document.addEventListener('click', function (evt) {
    var mousePos = getMousePos(canvas, evt);
    /*
    if (isInside(mousePos, panelPause)){
        game.isPause = false;
    }
    */
}, false);

// Отлавливаев ввод с клавиатуры
document.addEventListener('keydown', function (e) {
    if (e.keyCode === 32) {
        game.pauseIsActive(!game.isPause);
    }
    if (game.isPause) return;

    if (e.keyCode === 37 || e.keyCode === 65) {
        control.dir = 1;
    }
    else if (e.keyCode === 38 || e.keyCode === 87) {
        control.dir = 2;
    }
    else if (e.which === 39 || e.which === 68) {
        control.dir = 3;
    }
    else if (e.which === 40 || e.which === 83) {
        control.dir = 4;
    }

    // Если игрок меняет направление змейки впервой половине
    // клеточки то поворачиваем сразу, если нет то поворот произойдет
    // при достижении следующей
    if (glManager.lag < glManager.ms_per_update / 2 && !control.isBlockChangeSnakeDirection) {
        control.snakeDirection();
        control.isBlockChangeSnakeDirection = true; // Разрешаем только один раз менять направление
        // сбрасываем флаг в update.
        // Иначе змейка может разверутся на 180 градусов
        // в пределах клетки
    }
});


// СУЩНОСТИ ....................................................................


var control = {
    dir: 0,
    isBlockChangeSnakeDirection: false, //
    snakeDirection() {
        if (control.dir === 0) return;

        if (control.dir === 1 && snake.direction.x === 0) { // Кнопка влево нажата и змейка не перемещается
            snake.direction.x = -config.stepOfMovementSnake;                      // по горизонтали
            snake.direction.y = 0;
        }
        else if (control.dir === 2 && snake.direction.y === 0) { // Кнопка вверх и змейка не перемещается по верт.
            snake.direction.x = 0;
            snake.direction.y = -config.stepOfMovementSnake;
        }
        else if (control.dir === 3 && snake.direction.x === 0) { // Кнопка вправо и змейка не перемещается 
            snake.direction.x = config.stepOfMovementSnake;                            // по горизонтали
            snake.direction.y = 0;
        }
        else if (control.dir === 4 && snake.direction.y === 0) { // Кнопка вниз и змейка не перемещается по верт.
            snake.direction.x = 0;
            snake.direction.y = config.stepOfMovementSnake;
        }
        control.dir = 0;
    }
}

var game = {
    score: 0,
    isPause: false,

    pauseIsActive(flag) {
        this.isPause = flag;
        buttonContinue.style.display = flag ? "block" : "none";
        buttonPause.style.display = !flag ? "" : "none";
    },
    startGame() {
        this.isPause = false;
        snake.resetToStart();
        food.spawn();
        this.score = 0;
        scoreCounter.innerHTML = "" + game.score;
        buttonPause.style.display = "block";
        gameOverPanel.style.display = "none";
        if (localStorage.getItem('record') == null) localStorage.setItem('record', 0);
        recordCounter.innerHTML = "РЕКОРД: " + localStorage.getItem('record');
    },
    addScore() {
        food.spawn();
        game.score++;
        scoreCounter.innerHTML = "" + game.score;
        if (game.score > localStorage.getItem('record')) {
            localStorage.setItem('record', game.score);
            recordCounter.innerHTML = "РЕКОРД: " + game.score;
        }
    },
    gameOver() {
        buttonPause.style.display = "none";
        this.isPause = true;
        gameOverPanel.style.display = "block";
    }
}

var config = {
    grid: 16, // Размер сетки по которой мы строим змейку
    stepOfMovementSnake: 16, // Шаг движения змейки

    updateConfigForAndroid() {
        glManager.ms_per_update = 166;
        config.grid = 48;
        canvas.width = Math.floor((window.innerWidth) / config.grid) * config.grid - config.grid;
        canvas.height = Math.floor(((window.innerHeight * 60) / 100) / config.grid) * config.grid;
    }
}

// Структруа змейки
var snake = {

    position: { x: 0, y: 0 },
    direction: { x: config.stepOfMovementSnake, y: 0 },
    cells: [],
    startCountCells: 10,
    countCells: 0,
    roundRect: 5,
    resetToStart() {
        snake.position = { x: 192, y: 192 };
        snake.cells = [];
        for (let i = 0; i < snake.startCountCells; i++) {
            // Добавляет новый элемент массива в новую координату текущего положения змейки
            snake.cells.push({ x: snake.position.x - (config.grid * i), y: snake.position.y });
        }
        snake.countCells = snake.cells.length;
        snake.direction = { x: config.stepOfMovementSnake, y: 0 };
    },

    update() {
        snake.position.x += snake.direction.x;
        snake.position.y += snake.direction.y;

        // Если ушли за край тогда телепортируем змейку
        if (snake.position.x < 0) {
            snake.position.x = canvas.width - config.stepOfMovementSnake;
        }
        else if (snake.position.x >= canvas.width) {
            snake.position.x = 0;
        }
        if (snake.position.y < 0) {
            snake.position.y = canvas.height - config.stepOfMovementSnake;
        }
        else if (snake.position.y >= canvas.height) {
            snake.position.y = 0;
        }

        // Добавляет новый элемент массива в новую координату текущего положения змейки
        snake.cells.unshift({ x: snake.position.x, y: snake.position.y });

        // Если длина змейки привысила заданную (она по сути бесконечно растёт в направлении движения)
        // то удаляем последний элемент массива
        // Добавляем хвостик ПОСЛЕ (через одну итерацию) того, как мы скушали яблоко
        if (snake.cells.length > snake.countCells) {
            snake.cells.pop();
        }

        snake.checkCollision();
    },

    checkCollision() {
        // Проверяем столкновение
        snake.cells.forEach(function (cell, index) {

            if (cell.x == food.position.x && cell.y == food.position.y) {
                game.addScore();
                snake.countCells++;
            }

            for (let i = index + 1; i < snake.cells.length; i++) {
                if (cell.x === snake.cells[i].x &&
                    cell.y === snake.cells[i].y) {
                    game.gameOver();
                }
            }
        });
    },


    // Отрисовка змейки
    render() {

        var halfFrame = glManager.ms_per_update / glManager.lag;

        // Расчитываем интерполяцию            // Какая часть времени кадра прошла на данный момент
        var interpolationX = snake.direction.x / halfFrame;
        var interpolationY = snake.direction.y / halfFrame;

        // Обнуляем интерполяцию
        if (game.isPause){
            interpolationX = 0;
            interpolationY = 0;
            halfFrame = 1;
        } 


        snake.cells.forEach(function (cell, index) {
            if (index == 0) return; // Голову мы отрисовываем отдельно, поэтому пропускаем
            
            // Вычисляем направление к соседнему звену
            var newPosX = snake.cells[index - 1].x - cell.x;
            var newPosY = snake.cells[index - 1].y - cell.y;

            // Вычисляем позицию отрисовки на основе времени между кадров
            newPosCell = { x: cell.x + newPosX / halfFrame, y: cell.y + newPosY / halfFrame };

            // Если растояние между звеньями змейки большего ячейки, то принудительно
            // телепортируем звено (Нужно доработать)
            if (Math.abs(newPosX) > config.grid) newPosCell.x = cell.x;
            if (Math.abs(newPosY) > config.grid) newPosCell.y = cell.y;

            drawRoundRect(newPosCell, { x: config.grid, y: config.grid }, snake.roundRect, '#850009');
        });

        // Рисуем голову змейки
        var drawPos = { x: snake.position.x + interpolationX, y: snake.position.y + interpolationY };
        drawRoundRect(drawPos, { x: config.grid, y: config.grid }, snake.roundRect, '#ac0510');
    }
};

// Структруа яблока
var food = {
    position: { x: 0, y: 0 },

    spawn() {
        food.position.x = randomRange(0, canvas.width / config.grid) * config.grid;
        food.position.y = randomRange(0, canvas.height / config.grid) * config.grid;
        console.log("Food position: " + food.position.x + ", " + food.position.y);
    },

    render() {
        ctx.drawImage(apple, food.position.x, food.position.y, config.grid + 2, config.grid + 2);
    }
}

// ИГРОВОЙ ЦИКЛ ................................................................

var glManager = {
    ms_per_update: 100,    // Интервал между вычислениями
    fps: 0,
    elapsed: 0,            // Счетчик времени между кадрами
    currentTime: 0,
    pervious: Date.now(),
    lag: 0.0,
    frames: 0,

    gameLoop() {
        if (glManager.frames == 10000) glManager.frames = 0;

        // Текущее вермя
        glManager.currentTime = Date.now();
        glManager.elapsed = glManager.currentTime - glManager.pervious; // Время между предыдущим и текущим кадром
        glManager.pervious = glManager.currentTime;             // Сохраняем время текущего кадра
        glManager.lag += glManager.elapsed;                     // Суммированное время между кадрами

        // Если процессор обработал быстрее чем нужно, то пропускаем вычисления
        if (glManager.lag < glManager.ms_per_update) {
            render();
            requestAnimFrame(glManager.gameLoop);
            return;
        }

        // Сохраняем лаг, т.е время с предыдущего РАБОЧЕГО кадра (для подсчета ФПС)
        // Так-как потом мы изменяем glManager.lag
        var curLag = glManager.lag;

        // При накоплении лагов, змейка начнёт отставать на несколько итераций т.е перемещений
        // с помощью этого цикла мы нагоняем змейку к её нужному положению
        while (glManager.lag >= glManager.ms_per_update) {
            update();
            glManager.lag -= glManager.ms_per_update;
        }

        // Рендерим кадр с нужны интервалом (glManager.ms_per_update)
        render();
        glManager.fpsUpdate(curLag);
        requestAnimFrame(glManager.gameLoop);
    },
    fpsUpdate(curLag) {
        glManager.fps = (1000 / curLag).toFixed(1);
        fpsCounter.innerHTML = "FPS: " + glManager.fps;
    }
}

function update() {
    if (game.isPause) return;
    snake.update();
    control.snakeDirection();
    control.isBlockChangeSnakeDirection = false; // 
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snake.render();
    food.render();
}

// ВСПОМОГАТЕЛЬНЫЕ, УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ................................................................

var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 20);
        };
})();

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Функция проверяет попадает ли точка в область прямоугольника
function isInside(pos, rect) {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y
}

function drawRect(pos, scale, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(pos.x, pos.y, scale.x, scale.y);
    ctx.fill();
}

function drawRoundRect(pos, scale, round, color) {
    if (typeof ctx.roundRect === 'function'){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.roundRect(pos.x, pos.y, scale.x, scale.y, round);
        ctx.fill();
    }
    else { // Если браузер не поддерживает ctx.roundRect, то рисуем круги
        drawCircle({x:pos.x + 8, y:pos.y + 8}, scale, color);
    }
}

function drawCircle(pos, radius, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(pos.x, pos.y, radius.x/2, 0, 2 * Math.PI, false);
    ctx.fill();
}


//Function to get the mouse position
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
