/*jslint browser: true, devel: true, nomen: true, unparam: true */
/*global $, Backbone, _  */
$(function () {
    "use strict";
    var Tile, TileAdjacent, TileDiagonalAdjacent, TileUnclickable, TileView, tileViewTemplate,
        Board, BoardView, boardViewTemplate,
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
        click: function () {
            // Optional function parameter args = { board: source_board_model }
            // Default operation is toggle self, return true if success, false otherwise
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
        click: function (args) {
            // Flip adjacent tiles
            this.flipRelatedTiles(args, args.board.filterAdjacent);
            // Super
            return Tile.prototype.click.call(this, args);
        }
    });

    TileDiagonalAdjacent = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-diagonal-adjacent"
        },
        click: function (args) {
            // Flip diagonal adjacent tiles
            this.flipRelatedTiles(args, args.board.filterDiagonalAdjacent);
            // Super
            return Tile.prototype.click.call(this, args);
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
            input: []
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
        createRandomTile: function () {
            // Return a random Object that is an instance of Tile or its subclasses
            var n = _.random(0, 3);
            switch (n) {
            case 0:
                return new Tile();
            case 1:
                return new TileAdjacent();
            case 2:
                return new TileDiagonalAdjacent();
            case 3:
                return new TileUnclickable();
            }
        },
        createRandomClicks: function (n) {
            // Randomly click on the tiles
            // Return a matrix of boolean that shows which tiles are pressed
            var row = this.getRow(), col = this.getCol(), self = this, result = this.createMatrix(false);

            // Click the board randomly n times
            _.times(n, function () {
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
        filterAdjacent: function (r, c, i, j) {
            return (Math.abs(r - i) + Math.abs(c - j)) === 1;
        },
        filterDiagonalAdjacent: function (r, c, i, j) {
            return Math.abs(r - i) === 1 && Math.abs(c - j) === 1;
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
        createPuzzle: function (row, col, difficulty) {
            // Create tile models
            var tiles = new Array(row), i, j, answer, input;
            for (i = 0; i < row; i += 1) {
                tiles[i] = new Array(col);
                for (j = 0; j < col; j += 1) {
                    tiles[i][j] = this.createRandomTile().set({r: i, c: j});
                }
            }
            // Set tiles as soon as possible, since many functions depends on this property
            this.set("tiles", tiles);

            // Create random clicks to make a puzzle
            answer = this.createRandomClicks(difficulty);
            this.set("answer", answer);
            console.log(answer);

            // Create empty input matrix to record user's input
            input = this.createMatrix(false);
            this.set("input", input);
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
        initialize: function (args) {
            var row = (args.row || 0), col = (args.col || 0), difficulty = (args.difficulty || 10);
            this.createPuzzle(row, col, difficulty);
        }
    });

    /* Board View */
    boardViewTemplate = _.template($("#board-view-template").html());

    BoardView = Backbone.View.extend({
        tagName: "div",
        className: "board",
        template: boardViewTemplate,
        events: {
            "click .tile": "clickTileCallback",
            "click .next": "nextPuzzleCallback",
            "click .hint": "hintCallback"
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
            this.model.createPuzzle(10, 8, 10);
            this.render();
        },
        hintCallback: function (e) {
            e.preventDefault();
        }
    });

    /* Application View */
    AppView = Backbone.View.extend({
        tagName: "div",
        className: "app",
        initialize: function () {
            var board = new Board({row: 10, col: 8, difficulty: 10});
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
