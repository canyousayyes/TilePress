/*jslint browser: true, devel: true, nomen: true, unparam: true */
/*global $, Backbone, _  */
$(function () {
    "use strict";
    var Tile, TileAdjacent, TileView, tileViewTemplate,
        Board, BoardView, boardViewTemplate,
        AppView, Main;

    /* Tile Model */
    Tile = Backbone.Model.extend({
        defaults: {
            state: "on",
            type: "tile-blank"
        },
        toggle: function () {
            var state = this.get("state");
            if (state === "on") {
                this.set("state", "off");
            } else {
                this.set("state", "on");
            }
        },
        click: function () {
            this.toggle();
        },
        flip: function () {
            this.toggle();
        }
    });

    TileAdjacent = Tile.extend({
        defaults: {
            state: "on",
            type: "tile-adjacent"
        },
        click: function (args) {
            var relatedTiles;
            // Super
            Tile.prototype.click.apply(this, args);
            // Flip adjacent tiles
            relatedTiles = args.board.getRelatedTiles(args.i, args.j, args.board.adjacentFilter);
            _.each(relatedTiles, function (tile) {
                console.log(tile);
                tile.flip(args);
            });
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
            row: 0,
            col: 0,
            tiles: []
        },
        createRandomTile: function () {
            var n = Math.floor(Math.random() * 2);
            switch (n) {
            case 0:
                return new Tile();
            case 1:
                return new TileAdjacent();
            }
        },
        adjacentFilter: function (iCur, jCur, i, j) {
            return (Math.abs(iCur - i) + Math.abs(jCur - j)) === 1;
        },
        getRelatedTiles: function (iCur, jCur, predicate) {
            var tiles = this.get("tiles"), result = [];
            _.each(tiles, function (row, i) {
                _.each(row, function (tile, j) {
                    if (predicate(iCur, jCur, i, j) === true) {
                        result.push(tile);
                    }
                });
            });
            return result;
        },
        initialize: function () {
            var row = this.get("row"), col = this.get("col"), tiles, i, j;
            tiles = new Array(row);
            for (i = 0; i < row; i += 1) {
                tiles[i] = new Array(col);
                for (j = 0; j < col; j += 1) {
                    tiles[i][j] = this.createRandomTile();
                }
            }
            this.set("tiles", tiles);
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
            _.each(tiles, function (row, i) {
                _.each(row, function (tile, j) {
                    var $cell, tileView;
                    $cell = self.$(".board-cell[data-i=" + i + "][data-j=" + j + "]");
                    tileView = new TileView({model: tile});
                    $cell.append(tileView.render().$el);
                });
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
