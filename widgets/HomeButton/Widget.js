///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'jimu/BaseWidget',
    "esri/dijit/HomeButton",
    "esri/geometry/Extent",
    'esri/SpatialReference',
    'dojo/_base/html',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/keys',
    'dojo/on',
    "esri/layers/CSVLayer",
    "esri/Color",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/InfoTemplate",
    "esri/config"
],
    function (
        declare,
        lang,
        BaseWidget,
        HomeButton,
        Extent,
        SpatialReference,
        html,
        domConstruct,
        topic,
        keys,
        on,
        CSVLayer, Color, SimpleMarkerSymbol, SimpleRenderer, InfoTemplate, esriConfig) {
        var clazz = declare([BaseWidget], {

            name: 'HomeButton',
            baseClass: 'jimu-widget-homebutton',

            moveTopOnActive: false,

            postCreate: function () {
                html.setAttr(this.domNode, 'aria-label', window.apiNls.widgets.homeButton.home.title);
                this.own(topic.subscribe("appConfigChanged", lang.hitch(this, this.onAppConfigChanged)));
            },

            startup: function () {
                var initalExtent = null;
                this.inherited(arguments);
                this.own(on(this.map, 'extent-change', lang.hitch(this, 'onExtentChange')));

                var configExtent = this.appConfig && this.appConfig.map &&
                    this.appConfig.map.mapOptions && this.appConfig.map.mapOptions.extent;

                if (configExtent) {
                    initalExtent = new Extent(
                        configExtent.xmin,
                        configExtent.ymin,
                        configExtent.xmax,
                        configExtent.ymax,
                        new SpatialReference(configExtent.spatialReference)
                    );
                } else {
                    initalExtent = this.map._initialExtent || this.map.extent;
                }

                this.createHomeDijit({
                    map: this.map,
                    extent: initalExtent
                });

                this.addCSVcamersLayer();
            },

            createHomeDijit: function (options) {
                this.homeDijit = new HomeButton(options, domConstruct.create("div"));
                this.own(on(this.homeDijit, 'home', lang.hitch(this, 'onHome')));
                this.own(on(this.domNode, 'keydown', lang.hitch(this, this.onHomeKeyDown)));
                html.place(this.homeDijit.domNode, this.domNode);
                this.homeDijit.startup();
            },

            onAppConfigChanged: function (appConfig, reason, changedData) {
                if (reason === "mapOptionsChange" && changedData && appConfig &&
                    changedData.extent) {
                    var extent = new Extent(changedData.extent);
                    this.homeDijit.set("extent", extent);
                }
            },

            onExtentChange: function () {
                html.removeClass(this.domNode, 'inHome');
            },

            onHomeKeyDown: function (evt) {
                if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
                    this.homeDijit.home();//trigger home event
                }
            },

            onHome: function (evt) {
                if (!(evt && evt.error)) {
                    html.addClass(this.domNode, 'inHome');
                }
            },

            addCSVcamersLayer: function () {

                csv = new CSVLayer("./sample-data/2.5_week.csv", {
                    copyright: "USGS.gov"
                });
                var orangeRed = new Color([238, 69, 0]); // hex is #ff4500
                var marker = new SimpleMarkerSymbol("solid", 15, null, orangeRed);
                var renderer = new SimpleRenderer(marker);
                csv.setRenderer(renderer);
                
                var template = new InfoTemplate("Camera", "<a target='_blank' href='${video_url}'> Show me! </a>");
                csv.setInfoTemplate(template);

                this.map.addLayer(csv);
            }
        });
        return clazz;
    });