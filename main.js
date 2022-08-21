//Array helpers
class Arr {
    static init(n, f) {
        let arr = new Array(n);
        for (let i = 0; i < n; i += 1) {
            arr[i] = f(i);
        }
        return arr;
    }

    static for_all(arr, f) {
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

    is_full() {
        return Arr.for_all(this.cells, cell => cell != -1);
    }

    add_die(die) {
        let first_empty = this.cells.findIndex(cell => cell == -1);
        this.cells[first_empty] = die;
    }

    non_empty() {
        return this.cells.filter(cell => cell != -1);
    }

    die_counts() {
        let counts = {};
        let max_count = 0;
        this.non_empty().forEach(x => {
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
        const counts = this.die_counts();
        return this.non_empty().reduce((sum, cell) => sum + cell * counts[cell], 0);
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

    is_full() {
        return Arr.for_all(this.columns, col => col.is_full());
    }

    add_die({column, die}) {
        this.columns[column].add_die(die);
    }

    possible_moves() {
        let result = new Array();
        for (let i = 0; i < this.columns.length; i += 1) {
            if (!this.columns[i].is_full()) {
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

    game_over() {
        return Arr.exists(this.players, player => player.is_full());
    }

    next_turn() {
        if (this.game_over()) return;
        
        this.die = Rand.int(6) + 1;
        this.turn = 1 - this.turn;
    }

    available_moves() {
        return this.players[this.turn].possible_moves();
    }

    valid_move(column) {
        return !this.game_over() && this.available_moves().indexOf(column) != -1;
    }

    player_move(column) {
        let move = {column, die: this.die};
        this.players[this.turn].add_die(move);
        this.players[1 - this.turn].negate(move);
        this.next_turn();
    }
}

const DIE_SIZE = 60;
const CELL_SIZE = 90;
const CELL_COLOUR = 0xDE3249;
const MARGIN = 25
const PADDING = 5;
const PLAYER_SIZE = 3 * CELL_SIZE + 3 * PADDING;

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
                fontSize: 46,
                fontStyle: 'italic',
                fontWeight: 'bold',
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
        const score_style = 
            new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 22,
                fill: ['#ffffff'],
                strokeThickness: 5,
                wordWrapWidth: 440,
                lineJoin: 'round',
            });
        const next_move_style = 
            new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 36,
                stroke: '#4a1850',
                fill: ['#ffffff', '#00ff99'],
                fontStyle: 'italic',
                fontWeight: 'bold',
                strokeThickness: 5,
                wordWrapWidth: 440,
                lineJoin: 'round',
            });
        const game_over_style = 
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
        this.text_styles = {
            1: dice_style(['#ffffff', '#00ff99']),
            2: dice_style(['#ffffff', "#ffff00"]),
            3: dice_style(['#5ffcfc', "#9e5ffc"]),
            score: score_style,
            next_move: next_move_style,
            game_over: game_over_style
        };
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

    draw_cell({die, die_count}) {
        let container = new PIXI.Container();
        const box = new PIXI.Graphics();
        box.beginTextureFill({color: CELL_COLOUR, alpha: .9});
        box.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
        box.endFill();
        container.addChild(box);
        this.addChildToContainer(container, box, {x: 0, y: 0});
        if (die != -1) {
            let text = new PIXI.Text(String(die), this.text_styles[die_count]);
            this.addChildToContainer(box, text, {x: 27, y: 15});
        }
        return container;
    }

    draw_column({column, flip, game, redraw}) {
        let container = new PIXI.Container();
        let cells = flip ? Arr.rev(column.cells) : column.cells;
        let die_counts = column.die_counts();

        let cy = 0;
        for (const die of cells) {
            let cell = this.draw_cell({die, die_count: die_counts[die]});
            this.addChildToContainer(container, cell, {x: 0, y: cy});
            cy += CELL_SIZE + PADDING;
        }
        let on_click = () => {
            if (game.valid_move(column.which)) {
                game.player_move(column.which);
                redraw();
            }
        };
        container.interactive = true;
        container.on("click", on_click);
        container.on("tap", on_click);
        return container;
    }

    draw_player_board({player, flip, game, redraw}) {
        let container = new PIXI.Container();
        let cx = 0;
        for (const column of player.columns) {
            let col = this.draw_column({column, flip, game, redraw});
            this.addChildToContainer(container, col, {x: cx, y:0});
            cx += CELL_SIZE + PADDING;
        }
        return container;
    }

    draw_score(player) {
        let score = player.score();
        let scoreText  = new PIXI.Text("Score: " + String(score), this.text_styles["score"]);
        return scoreText;
    }

    draw_next_die(die) {
        return new PIXI.Text(String(die), this.text_styles["next_move"]);
    }

    draw_player(args) {
        let container = new PIXI.Container();
        let board = this.draw_player_board(args);
        let board_bla = this.addChildToContainer(container, board, {x: 0, y: 0});
        let boardBounds = board_bla.getBounds();
        {
            let scoreText = this.draw_score(args.player);
            let x = boardBounds.x + 210;
            let y = boardBounds.y - 37;
            if (args.flip) {
                y = boardBounds.y + PLAYER_SIZE - 5;
            }
    
            this.addChildToContainer(container, scoreText, {x, y});
        }
        if (!args.game.game_over() && args.player.which == args.game.turn) {
            let dieText = this.draw_next_die(args.game.die);
            let x = boardBounds.x;
            let y;
            if (args.flip) {
                y = dieText.y = boardBounds.y + PLAYER_SIZE - 10;
            } else {
                y = boardBounds.y - 45;
            }
            this.addChildToContainer(container, dieText, {x, y});
        }
        return container;
    }
    
    // draw_button(text, f) {
    //     let button = new PIXI.Graphics();
    //     button.beginFill(0x753b1c);
    //     button.drawRect(0, 0, 100, 30);
    //     button.endFill();
    //     let text = new PIXI.T
    // }

    draw_game({x, y, game}) {
        let container = new PIXI.Container();
        let redraw = () => {
            this.erase();
            this.draw_game({x, y, game});
        }
        let cy = y;
        for (let i = 0; i < game.players.length; i += 1) {
            let flip = (i == 0);
            let player = this.draw_player({player: game.players[i], flip, game, redraw});
            this.addChildToContainer(container, player, {x, y: cy});
            cy = this.app.screen.height - PLAYER_SIZE - 50;
        }
        if (game.game_over()) {
            let text = new PIXI.Text("GAME\nOVER!", this.text_styles["game_over"]);
            text.x = x;
            text.y = y + this.app.screen.height / 2 - 55;
            container.addChild(text);
            text.interactive = true;
            let restart = () => {
                this.erase();
                this.draw_game({x, y, game: new Game()});
            };
            text.on("click", restart);
            text.on("tap", restart);
        }
        return this.addChild(container);
    }
}

const graphics = new Graphics();

let game = new Game();
graphics.draw_game({x:MARGIN, y:10, game});
