//Array helpers
class Arr {
    static init(n, f) {
        let arr = new Array(n);
        for (let i = 0; i < n; i += 1) {
            arr[i] = f(i);
        }
        return arr;
    }

    static forAll(arr, f) {
        return arr.findIndex(x => !f(x)) == -1;
    }

    static exists(arr, f) {
        return arr.findIndex(f) != -1;
    }

    static rev(arr) {
        let result = [];
        for (let i = arr.length - 1; i >= 0; i -= 1) {
            result.push(arr[i]);
        }
        return result;
    }
}

class Rand {
    static int(n) {
        return Math.floor(Math.random() * n);
    }

    static die() {
        return Rand.int(6) + 1;
    }

    static pick(arr) {
        return arr[Rand.int(arr.length)];
    }
}
  

class Column {
    constructor(which) {
        // CR-someday: This is a bit hacky. We consider a cell to have a die if it's
        // value is not -1. Otherwise it's an empty cell. There are other hacks
        // in the code that treat a cell and a die as interchangable and it's confugsing.
        this.cells = Arr.init(3, _ => -1);
        this.which = which;
    }

    isFull() {
        return Arr.forAll(this.cells, cell => cell != -1);
    }

    addDie(die) {
        let first_empty = this.cells.findIndex(cell => cell == -1);
        this.cells[first_empty] = die;
    }

    nonEmpty() {
        return this.cells.filter(cell => cell != -1);
    }

    dieCounts() {
        let counts = {};
        let max_count = 0;
        this.nonEmpty().forEach(x => {
            if (counts[x]) {
                counts[x] += 1;
            } else {
                counts[x] = 1;
            }
            max_count = Math.max(max_count, counts[x]);
        });
        counts.max_count = max_count;
        return counts;
    }

    score() {
        const counts = this.dieCounts();
        return this.nonEmpty().reduce((sum, cell) => sum + cell * counts[cell], 0);
    }

    negate(die) {
        let result = this.cells.filter(cell => cell != die);
        while (result.length < 3) {
            result.push(-1);
        }
        this.cells = result;
    }

    next(...args) {
        this.cells.next(...args);
    }
}

class Player {
    constructor(which) {
        this.columns = Arr.init(3, i => new Column(i));
        this.which = which;
    }

    isFull() {
        return Arr.forAll(this.columns, col => col.isFull());
    }

    addDie({column, die}) {
        this.columns[column].addDie(die);
    }

    possibleMoves() {
        let result = new Array();
        for (let i = 0; i < this.columns.length; i += 1) {
            if (!this.columns[i].isFull()) {
                result.push(i);
            }
        }
        return result;
    }

    score() {
        return this.columns.reduce((sum, col) => sum + col.score(), 0);
    }

    negate({column, die}) {
        this.columns[column].negate(die);
    }
}
class Game {
    constructor() {
        this.players = Arr.init(2, i => new Player(i));
        this.turn = Rand.int(2);
        this.die = Rand.die();
    }

    gameOver() {
        return Arr.exists(this.players, player => player.isFull());
    }

    nextTurn() {
        if (this.gameOver()) return;
        
        this.die = Rand.int(6) + 1;
        this.turn = 1 - this.turn;
    }

    availableMoves() {
        return this.players[this.turn].possibleMoves();
    }

    validMove(column) {
        return !this.gameOver() && this.availableMoves().indexOf(column) != -1;
    }

    playerMove(column) {
        let move = {column, die: this.die};
        this.players[this.turn].addDie(move);
        this.players[1 - this.turn].negate(move);
        this.nextTurn();
    }
}

const DIE_SIZE = 60;
const CELL_SIZE = 90;
const CELL_COLOUR = 0xDE3249;
const BUTTON_COLOR = 0x3349dd;
const MARGIN = 25
const PADDING = 5;
const PLAYER_SIZE = 3 * CELL_SIZE + 3 * PADDING;
const DIE_UNICODE = ["\u2680", "\u2681", "\u2682", 	"\u2683", "\u2684", "\u2685"]
class Graphics {
    constructor() {
        this.app = new PIXI.Application({ 
            // autoResize: true,
            // resolution: devicePixelRatio,
            antialias: true,
            width: 360,
            height: 720
         });
        document.body.appendChild(this.app.view);
        // // Resize function window
        // let resize = () => {
        //     // Resize the renderer
        //     this.app.renderer.resize(window.innerWidth, window.innerHeight);
        // }

        // // Listen for window resize events
        // window.addEventListener('resize', resize);

        // resize();
        this.children = []
        const dice_style = (fill) =>
            new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 100,
                // fontStyle: 'italic',
                // fontWeight: 'bold',
                fill, // gradient
                stroke: '#4a1850',
                strokeThickness: 5,
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 4,
                dropShadowAngle: Math.PI / 6,
                dropShadowDistance: 4,
                lineJoin: 'round',
            });
        const scoreStyle =
            new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 20,
                fill: ['#ffffff'],
                strokeThickness: 5,
                wordWrapWidth: 440,
                lineJoin: 'round',
            });
        const nextMoveStyle =
            new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 60,
                stroke: '#4a1850',
                fill: ['#ffffff', '#00ff99'],
                // fontStyle: 'italic',
                // fontWeight: 'bold',
                strokeThickness: 5,
                wordWrapWidth: 440,
                lineJoin: 'round',
            });
        const gameOverStyle =
            new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 28,
                stroke: '#4a1850',
                fill: ['#ffffff'],
                fontStyle: 'italic',
                fontWeight: 'bold',
                strokeThickness: 5,
                wordWrapWidth: 440,
                lineJoin: 'round',
            });
        const buttonStyle =
            new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 22,
                fill: ['#ffffff'],
            });
        this.textStyles = {
            1: dice_style(['#ffffff', '#00ff99']),
            2: dice_style(['#ffffff', "#ffff00"]),
            3: dice_style(['#5ffcfc', "#9e5ffc"]),
            score: scoreStyle,
            next_move: nextMoveStyle,
            gameOver: gameOverStyle,
            button: buttonStyle
        };
        this.botEnabled = false;
    }

    set_onclick(on, f) {
        on.interactive = true;
        on.on("click", f);
        on.on("tap", f);
    }

    addChild(child) {
        this.children.push(child);
        return this.app.stage.addChild(child);
    }

    addChildToContainer(container, child, {x, y}) {
        child.x = container.x + x;
        child.y = container.y + y;
        return container.addChild(child);
    }

    erase() {
        for (const child of this.children) {
            this.app.stage.removeChild(child);
            child.destroy();
        }
        this.children = [];
    }

    drawCell({die, die_count}) {
        let container = new PIXI.Container();
        const box = new PIXI.Graphics();
        box.beginTextureFill({color: CELL_COLOUR, alpha: .9});
        box.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
        box.endFill();
        container.addChild(box);
        this.addChildToContainer(container, box, {x: 0, y: 0});
        if (die != -1) {
            let text = new PIXI.Text(DIE_UNICODE[die - 1], this.textStyles[die_count]);
            this.addChildToContainer(box, text, {x: 15, y: -25});
        }
        return container;
    }

    drawColumn({column, flip, game, redraw, player}) {
        let container = new PIXI.Container();
        let cells = flip ? Arr.rev(column.cells) : column.cells;
        let dieCounts = column.dieCounts();

        let cy = 0;
        for (const die of cells) {
            let cell = this.drawCell({die, die_count: dieCounts[die]});
            this.addChildToContainer(container, cell, {x: 0, y: cy});
            cy += CELL_SIZE + PADDING;
        }
        let on_click = () => {
            if (player.which == game.turn && game.validMove(column.which)) {
                game.playerMove(column.which);
                redraw();
            }
        };
        this.set_onclick(container, on_click);
        return container;
    }

    drawPlayerBoard({player, flip, game, redraw}) {
        let container = new PIXI.Container();
        let cx = 0;
        for (const column of player.columns) {
            let col = this.drawColumn({column, flip, game, redraw, player});
            this.addChildToContainer(container, col, {x: cx, y:0});
            cx += CELL_SIZE + PADDING;
        }
        return container;
    }

    drawScore(player) {
        let score = player.score();
        let scoreText  = new PIXI.Text("Score: " + String(score), this.textStyles["score"]);
        return scoreText;
    }

    drawNextDie(die) {
        return new PIXI.Text(DIE_UNICODE[die - 1], this.textStyles["next_move"]);
    }

    drawPlayer(args) {
        let container = new PIXI.Container();
        let board = this.drawPlayerBoard(args);
        this.addChildToContainer(container, board, {x: 0, y: 0});
        {
            let scoreText = this.drawScore(args.player);
            let x = PLAYER_SIZE - 95;
            let y = -30;
            if (args.flip) {
                y = PLAYER_SIZE - 5;
            }
    
            this.addChildToContainer(container, scoreText, {x, y});
        }
        if (!args.game.gameOver() && args.player.which == args.game.turn) {
            let dieText = this.drawNextDie(args.game.die);
            let x = 0;
            let y;
            if (args.flip) {
                y = PLAYER_SIZE - 25;
            } else {
                y = -60;
            }
            this.addChildToContainer(container, dieText, {x, y});
        }
        return container;
    }
    
    drawButton(text, f) {
        let button = new PIXI.Graphics();
        button.beginFill(BUTTON_COLOR);
        button.drawRoundedRect(0, 0, 85, 30, 5);
        button.endFill();
        let textp = new PIXI.Text(text, this.textStyles["button"]);
        this.addChildToContainer(button, textp, {x: 5, y: 2});
        this.set_onclick(button, f);
        return button;
    }

    drawGame({x, y, game}) {
        let container = new PIXI.Container();
        let redraw = () => {
            this.erase();
            this.drawGame({x, y, game});
        }
        let cy = y;
        for (let i = 0; i < game.players.length; i += 1) {
            let flip = (i == 0);
            let player = this.drawPlayer({player: game.players[i], flip, game, redraw});
            this.addChildToContainer(container, player, {x, y: cy});
            cy = this.app.screen.height - PLAYER_SIZE - 50;
        }
        let restart = () => {
            this.erase();
            this.drawGame({x, y, game: new Game()});
        };
        let restartButton = this.drawButton("Restart", restart);
        this.addChildToContainer(container, restartButton, {x: 120, y: PLAYER_SIZE + 15});
        // let menu_button = this.drawButton("menu", restart);
        // this.addChildToContainer(container, menu_button, {x: 120, y: PLAYER_SIZE + 55});
        if (game.gameOver()) {
            let text = new PIXI.Text("GAME\nOVER!", this.textStyles["gameOver"]);
            this.addChildToContainer(container, text, {x: 25, y: 300});
            container.addChild(text);
            text.interactive = true;
            
            this.set_onclick(text, restart);
        }
        return this.addChild(container);
    }
}

const graphics = new Graphics();

let game = new Game();
graphics.drawGame({x:MARGIN, y:10, game});
