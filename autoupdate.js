/*!
 * jQuery Templates Plugin
 * https://github.com/tropperstyle/jquery-autoupdate
 *
 * Copyright, Jonathan Tropper.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * MIT-LICENSE.txt
 * GPL-LICENSE.txt
 */
(function($) {
    if (!$.tmpl) {
        alert('Plugin requires jQuery tmpl plugin');
        return;
    }
    
    $.widget('cf.autoupdate', {
        options: {
            interval: 3000,
            template: '',
            source: '',
            blank: 'No Data'
        },
        _create: function() {
            var widget = this;

            this.items = [];
            this.initial = true;
            this.blankElement = this.options.template.tmpl({}).html(this.options.blank).appendTo(this.element).hide();
            this.resume();
        },
        destroy: function() {
            this.pause();
            $.Widget.prototype.destroy.apply(this, arguments);
        },
        pause: function() {
            window.clearInterval(this.refresher);
        },
        resume: function() {
            if (this.refresher) {
                this.pause();
                delete this.refresher;
            }
            var widget = this;
            this.__update();
            this.refresher = window.setInterval(function() { widget.__update(); }, this.options.interval);
        },
        update: function(items) {
            this.__process(items);
        },
        _remove: function(item) {
            item.element.fadeOut(function() { item.element.remove(); });
        },
        __update: function() {
            $.getJSON(this.options.source, $.proxy(this.__process, this));
        },
        __process: function(items) {
            var lastItem, widget = this, active = {};

            this.blankElement[items.length == 0 ? 'show' : 'hide']();

            for (var i = 0, length = items.length; i < length; i++) {
                var item = items[i], prevItem = widget.items[item.id];
                if (prevItem) {
                    var difference = widget.__compare(prevItem, item);
                    if ($.isEmptyObject(difference)) {
                        item.element = prevItem.element;
                    } else {
                        widget.__createElement(item);
                        prevItem.element.remove();
                        widget.__insert(item, lastItem, difference);
                    }
                    delete widget.items[item.id];
                } else {
                    widget.__createElement(item);
                    widget.__insert(item, lastItem);
                }

                lastItem = item;
                active[item.id] = item;
            }

            $.each(widget.items, function(id, item) { widget._remove(item); });

            widget.items = active;

            if (this.initial) { this._trigger('loaded'); this.initial = false; }
        },
        __compare: function(a, b) {
            a = $.extend(true, {}, a);
            b = $.extend(true, {}, b);
            delete a.element;
            delete b.element;

            diff = {};
            $.each(a, function(k, v) {
                if (b[k] != v) { diff[k] = [v, b[k]]; }
            });
            return diff;
        },
        __createElement: function(item) {
            item.element = this.options.template.tmpl(item);
            item.element.data('item', item);
            this._trigger('insert', null, item);
        },
        __insert: function(item, lastItem, difference) {
            lastItem ? item.element.insertAfter(lastItem.element) : item.element.prependTo(this.element);
            this._trigger('changed', null, { item: item, diff: difference });
        }
    });
})(jQuery);
