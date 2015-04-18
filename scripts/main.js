/*jslint browser: true, devel: true, nomen: true */
/*global $, Backbone, _  */
$(function () {
    "use strict";
    var Tile, TileView, tileViewTemplate,
        Board, BoardView, boardViewTemplate,
        AppView, Main;

    /* Tile */
    tileViewTemplate = _.template($("#tile-view-template").html());

    Tile = Backbone.Model.extend({
        defaults: {
            state: "on"
        },
        toggle: function () {
            var state = this.get("state");
            if (state === "on") {
                this.set("state", "off");
            } else {
                this.set("state", "on");
            }
        }
    });

    TileView = Backbone.View.extend({
        tagName: "div",
        className: "tile",
        template: tileViewTemplate,
        events: {
            "click": "toggle"
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
        toggle: function () {
            this.model.toggle();
        }
    });

    /* Board */
    boardViewTemplate = _.template($("#board-view-template").html());

    Board = Backbone.Model.extend({
        defaults: {
            row: 0,
            col: 0,
            tiles: []
        },
        initialize: function () {
            var row = this.get("row"), col = this.get("col"), tiles, i, j;
            tiles = new Array(row);
            for (i = 0; i < row; i += 1) {
                tiles[i] = new Array(col);
                for (j = 0; j < col; j += 1) {
                    tiles[i][j] = new Tile();
                }
            }
            this.set("tiles", tiles);
        }
    });

    BoardView = Backbone.View.extend({
        tagName: "div",
        className: "board",
        template: boardViewTemplate,
        render: function () {
            var self = this, tiles = this.model.get("tiles");

            // Render Board frame
            console.log('render board');
            this.$el.html(this.template(this.model.toJSON()));

            // Render Tiles
            _.each(tiles, function (row, i) {
                _.each(row, function (tile, j) {
                    var $cell, tileView;
                    $cell = self.$("#board-cell-" + i + "-" + j);
                    tileView = new TileView({model: tile});
                    $cell.append(tileView.render().$el);
                });
            });
            return this;
        }
    });

    AppView = Backbone.View.extend({
        tagName: "div",
        className: "app",
        initialize: function () {
            var tile, board;
            tile = new Tile({state: "off"});
            board = new Board({row: 20, col: 20});
            console.log(tile.get("state"));
            console.log(board.toJSON());
            this.tileView = new TileView({model: tile});
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
    window.a = Main;
    $('#main').append(Main.render().$el);
});
