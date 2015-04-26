/*jslint browser: true, devel: true, nomen: true, unparam: true */
/*global $, Backbone, _  */
$(function () {
    "use strict";
    var Tile, TileAdjacent, TileDiagonalAdjacent, TileUnclickable,
        TileUpLeft, TileUpRight, TileDownLeft, TileDownRight,
        TileUpLeftRight, TileDownLeftRight, TileUpDownLeft, TileUpDownRight,
        TileRowCol, TileBothDiagonal,
        TileView, tileViewTemplate,
        Board, BoardView, boardViewTemplate, hintViewTemplate,
        AppView, Main;

    /* Tile Model */
    Tile = Backbone.Model.extend({
        defaults: {
            state: "on",
            type: "tile-blank",
            r: -1,
            c: -1
        },
        toggle: function () {
            // Toggle self state to be on / off
            var state = this.get("state");
            if (state === "on") {
                this.set("state", "off");
            } else {
                this.set("state", "on");
            }
        },
        relatedTileFilterOnClick: function () {
            // Filter function when this tile is clicked.
            // Subclasses can override this and return an array of tiles to be flipped.
            return false;
        },
        click: function (args) {
            // Optional function parameter args = { board: source_board_model }
            // Default operation is toggle self, return true if success, false otherwise
            this.flipRelatedTiles(args, this.relatedTileFilterOnClick);
            this.toggle();
            return true;
        },
        flip: function () {
            // Optional function parameter args = { board: source_board_model }
            // Default operation is toggle self, return true if success, false otherwise
            this.toggle();
            return true;
        },
        flipRelatedTiles: function (args, predicate) {
            // Call flip(args) on relatedTiles based on the filter predicate
            var relatedTiles, r = this.get("r"), c = this.get("c");
            if (r < 0 || c < 0) {
                return;
            }
            relatedTiles = args.board.getRelatedTiles(r, c, predicate);
            _.each(relatedTiles, function (tile) {
                tile.flip(args);
            });
        }
    });

    TileAdjacent = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-adjacent"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return (Math.abs(r - i) + Math.abs(c - j)) === 1;
        }
    });

    TileDiagonalAdjacent = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-diagonal-adjacent"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return Math.abs(r - i) === 1 && Math.abs(c - j) === 1;
        }
    });

    TileUnclickable = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-unclickable"
        },
        click: function (args) {
            // You shall not press!
            return false;
        }
    });
    
    TileUpLeft = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-up-left"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r > i) && (c === j)) || ((r === i) && (c > j));
        }
    });
    
    TileUpRight = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-up-right"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r > i) && (c === j)) || ((r === i) && (c < j));
        }
    });
    
    TileDownLeft = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-down-left"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r < i) && (c === j)) || ((r === i) && (c > j));
        }
    });
    
    TileDownRight = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-down-right"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r < i) && (c === j)) || ((r === i) && (c < j));
        }
    });

    TileUpLeftRight = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-up-left-right"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r > i) && (c === j)) || ((r === i) && (c !== j));
        }
    });

    TileDownLeftRight = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-down-left-right"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r < i) && (c === j)) || ((r === i) && (c !== j));
        }
    });
    
    TileUpDownLeft = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-up-down-left"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r !== i) && (c === j)) || ((r === i) && (c > j));
        }
    });

    TileUpDownRight = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-up-down-right"
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            return ((r !== i) && (c === j)) || ((r === i) && (c < j));
        }
    });

    TileRowCol = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-row-col"
        },
        isSameRow: function (r, c, i, j) {
            return (r === i) && (c !== j);
        },
        isSameCol: function (r, c, i, j) {
            return (r !== i) && (c === j);
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            console.log(this.get("r"), this.get("c"));
            return this.isSameRow(r, c, i, j) || this.isSameCol(r, c, i, j);
        }
    });

    TileBothDiagonal = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-both-diagonal"
        },
        isSameDiagonal: function (r, c, i, j) {
            return ((r - i) === (c - j)) && (r !== i) && (c !== j);
        },
        isSameReverseDiagonal: function (r, c, i, j) {
            return ((r - i) === (j - c)) && (r !== i) && (c !== j);
        },
        relatedTileFilterOnClick: function (r, c, i, j) {
            console.log(this.get("r"), this.get("c"));
            return this.isSameDiagonal(r, c, i, j) || this.isSameReverseDiagonal(r, c, i, j);
        }
    });

    /* Tile View */
    tileViewTemplate = _.template($("#tile-view-template").html());

    TileView = Backbone.View.extend({
        tagName: "div",
        className: "tile",
        template: tileViewTemplate,
        initialize: function () {
            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);
        },
        render: function () {
            console.log('render tile');
            this.$el.removeClass("tile-on tile-off").addClass("tile-" + this.model.get("state"));
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    /* Board Model */
    Board = Backbone.Model.extend({
        defaults: {
            tiles: [],
            answer: [],
            input: [],
            difficulty: "beginner"
        },
        getRow: function () {
            // Return number of rows in the tiles
            return this.get("tiles").length;
        },
        getCol: function () {
            // Return number of columns of the tiles
            if (this.getRow === 0) {
                return 0;
            }
            return this.get("tiles")[0].length;
        },
        setDifficulty: function (difficulty) {
            this.set("difficulty", difficulty);
        },
        eachTile: function (callback) {
            // Call a function on each tile
            // callback is a function with parameter (tile, i, j)
            // tile = tile_model, i = row_index, j = col_index
            var tiles = this.get("tiles");
            _.each(tiles, function (tileRow, i) {
                _.each(tileRow, function (tile, j) {
                    callback.call(this, tile, i, j);
                });
            });
        },
        createMatrix: function (val) {
            // Create a row * col matrix with value = val
            var row = this.getRow(), col = this.getCol(), matrix = new Array(row), i, j;
            for (i = 0; i < row; i += 1) {
                matrix[i] = new Array(col);
                for (j = 0; j < col; j += 1) {
                    matrix[i][j] = val;
                }
            }
            return matrix;
        },
        createRandomTile: function (minTileType, maxTileType) {
            // Return a random Object that is an instance of Tile or its subclasses
            var n = _.random(minTileType, maxTileType);
            switch (n) {
            case 0:
                return new Tile();
            case 1:
                return new TileAdjacent();
            case 2:
                return new TileDiagonalAdjacent();
            case 3:
                return new TileUnclickable();
            case 4:
                return new TileUpLeft();
            case 5:
                return new TileUpRight();
            case 6:
                return new TileDownLeft();
            case 7:
                return new TileDownRight();
            case 8:
                return new TileUpLeftRight();
            case 9:
                return new TileDownLeftRight();
            case 10:
                return new TileUpDownLeft();
            case 11:
                return new TileUpDownRight();
            case 12:
                return new TileRowCol();
            case 13:
                return new TileBothDiagonal();
            default:
                return new Tile();
            }
        },
        createRandomClicks: function (numClicks) {
            // Randomly click on the tiles
            // Return a matrix of boolean that shows which tiles are pressed
            var row = this.getRow(), col = this.getCol(), self = this, result = this.createMatrix(false);

            // Click the board randomly numClicks times
            _.times(numClicks, function () {
                var i = _.random(0, row - 1), j = _.random(0, col - 1), success;
                // If already clicked, skip
                if (result[i][j] === true) {
                    return;
                }
                // Click the chosen tile
                success = self.clickTile(i, j, true);
                // Mark down in answer if success
                if (success === true) {
                    result[i][j] = true;
                }
            });
            return result;
        },
        getRelatedTiles: function (r, c, predicate) {
            // Get related tile models based on predicate function
            // r = row_index, c = col_index
            // predicate = function (r, c, i, j)
            // i = row_index of the filtered tile, j = col_index of the filtered tile
            // Return an array of tile models that fits the predicate function
            var result = [];
            this.eachTile(function (tile, i, j) {
                if (predicate.call(tile, r, c, i, j) === true) {
                    result.push(tile);
                }
            });
            return result;
        },
        createPuzzle: function (row, col, minTileType, maxTileType, numClicks) {
            // Create a new puzzle with dimension row * col,
            // each tile is randomly chosen between minTileType and maxTileType
            // and then the puzzle is clicked numClicks randomly

            // Create tile models
            var tiles = new Array(row), i, j, answer, input;
            for (i = 0; i < row; i += 1) {
                tiles[i] = new Array(col);
                for (j = 0; j < col; j += 1) {
                    tiles[i][j] = this.createRandomTile(minTileType, maxTileType).set({r: i, c: j});
                }
            }
            // Set tiles as soon as possible, since many functions depends on this property
            this.set("tiles", tiles);

            // Create random clicks to make a puzzle
            answer = this.createRandomClicks(numClicks);
            this.set("answer", answer);
            console.log(answer);

            // Create empty input matrix to record user's input
            input = this.createMatrix(false);
            this.set("input", input);
        },
        createPuzzleFromDifficulty: function () {
            // Create a puzzle based on a predefined difficulty
            var difficulty = this.get("difficulty");
            switch (difficulty) {
            case "beginner":
                this.createPuzzle(4, 4, 0, 3, 8);
                break;
            case "advanced":
                this.createPuzzle(6, 6, 0, 6, 12);
                break;
            case "proficient":
                this.createPuzzle(8, 8, 0, 11, 20);
                break;
            case "expert":
                this.createPuzzle(10, 10, 0, 13, 1);
                break;
            case "master":
                this.createPuzzle(12, 12, 8, 13, 48);
                break;
            default:
                this.createPuzzle(4, 4, 0, 2, 8);
                break;
            }
        },
        isComplete: function () {
            // Return true if the whole board is in the same state, false otherwise
            var row = this.getRow(), col = this.getCol(), tiles = this.get("tiles"), state, result;
            // Exceptional case
            if ((row === 0) || (col === 0)) {
                return true;
            }
            // Check if all tiles have the same state
            state = tiles[0][0].get("state");
            result = true;
            this.eachTile(function (tile) {
                if (tile.get("state") !== state) {
                    result = false;
                }
            });
            return result;
        },
        getHint: function () {
            // Get a hint move. Return object {r: row_index, c: col_index}
            var row = this.getRow(), col = this.getCol(), i, j,
                answer = this.get("answer"), input = this.get("input"), diff = [];
            for (i = 0; i < row; i += 1) {
                for (j = 0; j < col; j += 1) {
                    if (answer[i][j] !== input[i][j]) {
                        diff.push({r: i, c: j});
                    }
                }
            }
            if (diff.length > 0) {
                return _.sample(diff, 1)[0];
            }
            return null;
        },
        clickTile: function (i, j, force) {
            // Click tile model on tiles[i][j]
            // Return true if success, false otherwise
            var row = this.getRow(), col = this.getCol(), args;
            if ((force === false) && (this.isComplete())) {
                return false;
            }
            if ((i < 0) || (i >= row) || (j < 0) || (j >= col)) {
                return false;
            }
            args = { board: this };
            return this.get("tiles")[i][j].click(args);
        },
        clickTileCallback: function (i, j) {
            var success, input;
            success = this.clickTile(i, j, false);
            // Record the input if success
            if (success === true) {
                input = this.get("input");
                input[i][j] = !input[i][j];
                this.set("input", input);
            }
        },
        initialize: function () {
            this.createPuzzleFromDifficulty();
        }
    });

    /* Board View */
    boardViewTemplate = _.template($("#board-view-template").html());
    hintViewTemplate = _.template($("#hint-view-template").html());

    BoardView = Backbone.View.extend({
        tagName: "div",
        className: "board",
        template: boardViewTemplate,
        events: {
            "click .tile": "clickTileCallback",
            "click .next": "nextPuzzleCallback",
            "click .hint": "hintCallback",
            "click .tile-hint": "removeAllHints",
            "click .level": "adjustLevelCallback"
        },
        render: function () {
            var self = this;

            // Render Board frame
            console.log('render board');
            this.$el.html(this.template(this.model.toJSON()));

            // Render Tiles
            this.model.eachTile(function (tile, i, j) {
                var $cell, tileView;
                $cell = self.$(".board-cell[data-i=" + i + "][data-j=" + j + "]");
                tileView = new TileView({model: tile});
                $cell.append(tileView.render().$el);
            });
            return this;
        },
        clickTileCallback: function (e) {
            var $cell, i, j;
            if (e.currentTarget) {
                // Click that tile
                $cell = this.$(e.currentTarget).parent();
                i = $cell.data("i");
                j = $cell.data("j");
                this.model.clickTileCallback(i, j);
            }
            if (this.model.isComplete()) {
                this.$('.board-complete').show();
            }
        },
        nextPuzzleCallback: function () {
            this.$('.board-complete').hide();
            this.model.createPuzzleFromDifficulty();
            this.render();
        },
        removeAllHints: function () {
            this.$(".tile-hint").remove();
        },
        addHint: function (hint) {
            var $cell;
            this.removeAllHints();
            $cell = this.$(".board-cell[data-i=" + hint.r + "][data-j=" + hint.c + "]");
            if ($cell.length > 0) {
                $cell.append(hintViewTemplate());
            }
        },
        hintCallback: function (e) {
            var hint;
            e.preventDefault();
            hint = this.model.getHint();
            if (hint) {
                this.addHint(hint);
            }
        },
        adjustLevelCallback: function (e) {
            var difficulty;
            e.preventDefault();
            if (e.currentTarget) {
                difficulty = this.$(e.currentTarget).data("difficulty") || "beginner";
                this.model.setDifficulty(difficulty);
                this.nextPuzzleCallback();
            }
        }
    });

    /* Application View */
    AppView = Backbone.View.extend({
        tagName: "div",
        className: "app",
        initialize: function () {
            var board = new Board();
            this.boardView = new BoardView({model: board});
        },
        render: function () {
            console.log('render app');
            this.$el.html("");
            this.$el.append(this.boardView.render().$el);
            return this;
        }
    });

    Main = new AppView();
    $('#main').append(Main.render().$el);
});
