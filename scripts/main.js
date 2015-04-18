/*jslint browser: true, devel: true, nomen: true, unparam: true */
/*global $, Backbone, _  */
$(function () {
    "use strict";
    var Tile, TileAdjacent, TileDiagonalAdjacent, TileView, tileViewTemplate,
        Board, BoardView, boardViewTemplate,
        AppView, Main;

    /* Tile Model */
    Tile = Backbone.Model.extend({
        defaults: {
            state: "on",
            type: "tile-blank"
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
            /* Optional function parameter args = {
                    i: source_tile_row_position, 
                    j: source_tile_col_position,
                    board: source_board_model
                }
            */
            // Default operation is toggle self
            this.toggle();
        },
        flip: function () {
            // Optional function parameter args
            // Default operation is toggle self
            this.toggle();
        },
        flipRelatedTiles: function (args, predicate) {
            // Call flip(args) on relatedTiles based on the filter predicate
            var relatedTiles;
            relatedTiles = args.board.getRelatedTiles(args.i, args.j, predicate);
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
            // Super
            Tile.prototype.click.apply(this, args);
            // Flip adjacent tiles
            this.flipRelatedTiles(args, args.board.filterAdjacent);
        }
    });

    TileDiagonalAdjacent = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-diagonal-adjacent"
        },
        click: function (args) {
            // Super
            Tile.prototype.click.apply(this, args);
            // Flip diagonal adjacent tiles
            this.flipRelatedTiles(args, args.board.filterDiagonalAdjacent);
        }
    });

    /* Tile View */
    tileViewTemplate = _.template($("#tile-view-template").html());

    TileView = Backbone.View.extend({
        tagName: "div",
        className: "tile",
        template: tileViewTemplate,
        events: {
            "clicktile": "clickTileCallback"
        },
        initialize: function () {
            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);
        },
        render: function () {
            console.log('render tile');
            this.$el.removeClass("tile-on tile-off").addClass("tile-" + this.model.get("state"));
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        clickTileCallback: function (e, args) {
            this.model.click(args);
        }
    });

    /* Board Model */
    Board = Backbone.Model.extend({
        defaults: {
            tiles: []
        },
        getRow: function () {
            return this.get("tiles").length;
        },
        getCol: function () {
            if (this.getRow === 0) {
                return 0;
            }
            return this.get("tiles")[0].length;
        },
        eachTile: function (callback) {
            var tiles = this.get("tiles");
            _.each(tiles, function (tileRow, i) {
                _.each(tileRow, function (tile, j) {
                    callback.call(this, tile, i, j);
                });
            });
        },
        createRandomTile: function () {
            var n = _.random(0, 2);
            switch (n) {
            case 0:
                return new Tile();
            case 1:
                return new TileAdjacent();
            case 2:
                return new TileDiagonalAdjacent();
            }
        },
        createRandomClicks: function (n) {
            var tiles = this.get("tiles"), row = this.getRow(), col = this.getCol(), self = this;

            // Click the board randomly n times
            _.times(n, function () {
                var i = _.random(0, row - 1), j = _.random(0, col - 1), args;
                args = {
                    i: i,
                    j: j,
                    board: self
                };
                console.log(i, j);
                tiles[i][j].click(args);
            });
        },
        filterAdjacent: function (iCur, jCur, i, j) {
            return (Math.abs(iCur - i) + Math.abs(jCur - j)) === 1;
        },
        filterDiagonalAdjacent: function (iCur, jCur, i, j) {
            return Math.abs(iCur - i) === 1 && Math.abs(jCur - j) === 1;
        },
        getRelatedTiles: function (iCur, jCur, predicate) {
            var result = [];
            this.eachTile(function (tile, i, j) {
                if (predicate.call(tile, iCur, jCur, i, j) === true) {
                    result.push(tile);
                }
            });
            return result;
        },
        initialize: function (args) {
            var row = (args.row || 0), col = (args.col || 0), tiles, i, j;
            tiles = new Array(row);
            for (i = 0; i < row; i += 1) {
                tiles[i] = new Array(col);
                for (j = 0; j < col; j += 1) {
                    tiles[i][j] = this.createRandomTile();
                }
            }
            this.set("tiles", tiles);
            this.createRandomClicks(10);
        }
    });

    /* Board View */
    boardViewTemplate = _.template($("#board-view-template").html());

    BoardView = Backbone.View.extend({
        tagName: "div",
        className: "board",
        template: boardViewTemplate,
        events: {
            "click .tile": "clickTileCallback"
        },
        render: function () {
            var self = this, tiles = this.model.get("tiles");

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
            var $cell, $tile, args;
            if (e.currentTarget) {
                // Collect event data
                $tile = this.$(e.currentTarget);
                $cell = $tile.parent();
                args = {
                    board: this.model,
                    i: $cell.data("i"),
                    j: $cell.data("j")
                };
                // Trigger event in TileView and let it handle the click event
                this.$(e.currentTarget).trigger("clicktile", args);
            }
        }
    });

    /* Application View */
    AppView = Backbone.View.extend({
        tagName: "div",
        className: "app",
        initialize: function () {
            var board = new Board({row: 10, col: 8});
            console.log(board.toJSON());
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
