jQuery(document).on("ready", function ($) {
    (function (factory) {
        'use strict';

        if (typeof define === 'function' && define.amd) {
            // AMD. Register as an anonymous module.
            define(['jquery'], factory);
        } else if (typeof exports === 'object') {
            // CommonJS
            factory(require('jquery'));
        } else {
            // Browser globals
            factory(jQuery);
        }
    }(function ($) {
        'use strict';

        /**
         * Range feature detection
         * @return {Boolean}
         */
        function supportsRange() {
            var input = document.createElement('input');
            input.setAttribute('type', 'range');
            return input.type !== 'text';
        }

        var pluginName = 'qis',
            pluginInstances = [],
            inputrange = supportsRange(),
            defaults = {
                polyfill: true,
                rangeClass: 'qis',
                disabledClass: 'qis--disabled',
                fillClass: 'qis__fill',
                handleClass: 'qis__handle',
                startEvent: ['mousedown', 'touchstart', 'pointerdown'],
                moveEvent: ['mousemove', 'touchmove', 'pointermove'],
                endEvent: ['mouseup', 'touchend', 'pointerup']
            };

        /**
         * Delays a function for the given number of milliseconds, and then calls
         * it with the arguments supplied.
         *
         * @param  {Function} fn   [description]
         * @param  {Number}   wait [description]
         * @return {Function}
         */
        function delay(fn, wait) {
            var args = Array.prototype.slice.call(arguments, 2);
            return setTimeout(function () {
                return fn.apply(null, args);
            }, wait);
        }

        /**
         * Returns a debounced function that will make sure the given
         * function is not triggered too much.
         *
         * @param  {Function} fn Function to debounce.
         * @param  {Number}   debounceDuration OPTIONAL. The amount of time in milliseconds for which we will debounce the function. (defaults to 100ms)
         * @return {Function}
         */
        function debounce(fn, debounceDuration) {
            debounceDuration = debounceDuration || 100;
            return function () {
                if (!fn.debouncing) {
                    var args = Array.prototype.slice.apply(arguments);
                    fn.lastReturnVal = fn.apply(window, args);
                    fn.debouncing = true;
                }
                clearTimeout(fn.debounceTimeout);
                fn.debounceTimeout = setTimeout(function () {
                    fn.debouncing = false;
                }, debounceDuration);
                return fn.lastReturnVal;
            };
        }

        /**
         * Plugin
         * @param {String} element
         * @param {Object} options
         */
        function Plugin(element, options) {
            this.$window = $(window);
            this.$document = $(document);
            this.$element = $(element);
            this.options = $.extend({}, defaults, options);
            this._defaults = defaults;
            this._name = pluginName;
            this.startEvent = this.options.startEvent.join('.' + pluginName + ' ') + '.' + pluginName;
            this.moveEvent = this.options.moveEvent.join('.' + pluginName + ' ') + '.' + pluginName;
            this.endEvent = this.options.endEvent.join('.' + pluginName + ' ') + '.' + pluginName;
            this.polyfill = this.options.polyfill;
            this.onInit = this.options.onInit;
            this.onSlide = this.options.onSlide;
            this.onSlideEnd = this.options.onSlideEnd;

            // Plugin should only be used as a polyfill
            if (this.polyfill) {
                // Input range support?
                if (inputrange) {
                    return false;
                }
            }

            this.identifier = 'js-' + pluginName + '-' + (+new Date());
            this.min = parseFloat(this.$element[0].getAttribute('min') || 0);
            this.max = parseFloat(this.$element[0].getAttribute('max') || 100);
            this.value = parseFloat(this.$element[0].value || this.min + (this.max - this.min) / 2);
            this.step = parseFloat(this.$element[0].getAttribute('step') || 1);
            this.$fill = $('<div class="' + this.options.fillClass + '" />');
            this.$handle = $('<div class="' + this.options.handleClass + '" />');
            this.$range = $('<div class="' + this.options.rangeClass + '" id="' + this.identifier + '" />').insertAfter(this.$element).prepend(this.$fill, this.$handle);

            // visually hide the input
            this.$element.css({
                'position': 'absolute',
                'width': '1px',
                'height': '1px',
                'overflow': 'hidden',
                'opacity': '0'
            });

            // Store context
            this.handleDown = $.proxy(this.handleDown, this);
            this.handleMove = $.proxy(this.handleMove, this);
            this.handleEnd = $.proxy(this.handleEnd, this);

            this.init();

            // Attach Events
            var _this = this;
            this.$window.on('resize' + '.' + pluginName, debounce(function () {
                // Simulate resizeEnd event.
                delay(function () {
                    _this.update();
                }, 300);
            }, 20));

            this.$document.on(this.startEvent, '#' + this.identifier + ':not(.' + this.options.disabledClass + ')', this.handleDown);

            // Listen to programmatic value changes
            this.$element.on('change' + '.' + pluginName, function (e, data) {
                if (data && data.origin === pluginName) {
                    return;
                }

                var value = e.target.value,
                    pos = _this.getPositionFromValue(value);
                _this.setPosition(pos);
            });
        }

        Plugin.prototype.init = function () {
            if (this.onInit && typeof this.onInit === 'function') {
                this.onInit();
            }
            this.update();
        };

        Plugin.prototype.update = function () {
            this.handleWidth = this.$handle[0].offsetWidth;
            this.rangeWidth = this.$range[0].offsetWidth;
            this.maxHandleX = this.rangeWidth - this.handleWidth;
            this.grabX = this.handleWidth / 2;
            this.position = this.getPositionFromValue(this.value);

            // Consider disabled state
            if (this.$element[0].disabled) {
                this.$range.addClass(this.options.disabledClass);
            } else {
                this.$range.removeClass(this.options.disabledClass);
            }

            this.setPosition(this.position);
        };

        Plugin.prototype.handleDown = function (e) {
            e.preventDefault();
            this.$document.on(this.moveEvent, this.handleMove);
            this.$document.on(this.endEvent, this.handleEnd);

            // If we click on the handle don't set the new position
            if ((' ' + e.target.className + ' ').replace(/[\n\t]/g, ' ').indexOf(this.options.handleClass) > -1) {
                return;
            }

            var posX = this.getRelativePosition(this.$range[0], e),
                handleX = this.getPositionFromNode(this.$handle[0]) - this.getPositionFromNode(this.$range[0]);

            this.setPosition(posX - this.grabX);

            if (posX >= handleX && posX < handleX + this.handleWidth) {
                this.grabX = posX - handleX;
            }
        };

        Plugin.prototype.handleMove = function (e) {
            e.preventDefault();
            var posX = this.getRelativePosition(this.$range[0], e);
            this.setPosition(posX - this.grabX);
        };

        Plugin.prototype.handleEnd = function (e) {
            e.preventDefault();
            this.$document.off(this.moveEvent, this.handleMove);
            this.$document.off(this.endEvent, this.handleEnd);

            if (this.onSlideEnd && typeof this.onSlideEnd === 'function') {
                this.onSlideEnd(this.position, this.value);
            }
        };

        Plugin.prototype.cap = function (pos, min, max) {
            if (pos < min) {
                return min;
            }
            if (pos > max) {
                return max;
            }
            return pos;
        };

        Plugin.prototype.setPosition = function (pos) {
            var value, left;

            // Snapping steps
            value = (this.getValueFromPosition(this.cap(pos, 0, this.maxHandleX)) / this.step) * this.step;
            left = this.getPositionFromValue(value);

            // Update ui
            this.$fill[0].style.width = (left + this.grabX) + 'px';
            this.$handle[0].style.left = left + 'px';
            this.setValue(value);

            // Update globals
            this.position = left;
            this.value = value;

            if (this.onSlide && typeof this.onSlide === 'function') {
                this.onSlide(left, value);
            }
        };

        Plugin.prototype.getPositionFromNode = function (node) {
            var i = 0;
            while (node !== null) {
                i += node.offsetLeft;
                node = node.offsetParent;
            }
            return i;
        };

        Plugin.prototype.getRelativePosition = function (node, e) {
            return (e.pageX || e.originalEvent.clientX || e.originalEvent.touches[0].clientX || e.currentPoint.x) - this.getPositionFromNode(node);
        };

        Plugin.prototype.getPositionFromValue = function (value) {
            var percentage, pos;
            percentage = (value - this.min) / (this.max - this.min);
            pos = percentage * this.maxHandleX;
            return pos;
        };

        Plugin.prototype.getValueFromPosition = function (pos) {
            var percentage, value;
            percentage = ((pos) / (this.maxHandleX || 1));
            value = this.step * Math.ceil((((percentage) * (this.max - this.min)) + this.min) / this.step);
            return Number((value).toFixed(2));
        };

        Plugin.prototype.setValue = function (value) {
            if (value !== this.value) {
                this.$element.val(value).trigger('change', {
                    origin: pluginName
                });
            }
        };

        Plugin.prototype.destroy = function () {
            this.$document.off(this.startEvent, '#' + this.identifier, this.handleDown);
            this.$element
                .off('.' + pluginName)
                .removeAttr('style')
                .removeData('plugin_' + pluginName);

            // Remove the generated markup
            if (this.$range && this.$range.length) {
                this.$range[0].parentNode.removeChild(this.$range[0]);
            }

            // Remove global events if there isn't any instance anymore.
            pluginInstances.splice(pluginInstances.indexOf(this.$element[0]), 1);
            if (!pluginInstances.length) {
                this.$window.off('.' + pluginName);
            }
        };

        // A really lightweight plugin wrapper around the constructor,
        // preventing against multiple instantiations
        $.fn[pluginName] = function (options) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('plugin_' + pluginName);

                // Create a new instance.
                if (!data) {
                    $this.data('plugin_' + pluginName, (data = new Plugin(this, options)));
                    pluginInstances.push(this);
                }

                // Make it possible to access methods from public.
                // e.g `$element.qis('method');`
                if (typeof options === 'string') {
                    data[options]();
                }
            });
        };

    }));
});

var qis_loan_selector = 'form.qis_form';
var qis_slider_selector = 'div.range';

function qisCalculate(e) {
    /*
    	Change relevent element's output value
    */
    var $ = jQuery,
        form = $(this).closest(qis_loan_selector),
        rates = qis__rates[form.attr('id')],
        sliders = form.find(qis_slider_selector),
        p = sliders.eq(0),
        t = sliders.eq(1),
        principal = parseFloat(p.find('input').val()),
        term = parseFloat(t.find('input').val()) || rates.periodstep;

    /*
    	Output principal
    */
    p.find('output').text(rates.cb + principal.toString().qis_separator(rates.separator) + rates.ca);

    /*
    	Output term
    */
    t.find('output').text(term + ' ' + rates.period);


    /*
    	Everything below this point should happen no matter WHICH slider is moved
    */

    /*
    	Apply interest rate
    */
    var primary_rate = rates.primary * .01 + 1;
    var secondary_rate = rates.secondary * .01 + 1;

    if (rates.periodslider && rates.interesttype == 'compound') {
        primary_rate = Math.pow(primary_rate, term);
        secondary_rate = Math.pow(secondary_rate, term);
    }

    var primarytotal = principal * primary_rate;
    var secondarytotal = principal * secondary_rate;

    var primary = primarytotal - principal;
    var secondary = secondarytotal - principal;


    /*
    	Compare trigger
    */
    var rate = ((term >= rates.trigger) ? rates.secondary : rates.primary);
    var interest = ((term >= rates.trigger) ? secondary : primary);
    var total = principal + interest;
    var repayment = total * rates.periodstep / (term * rates.multiplier);

    if (rates.periodslider && rates.interesttype == 'compound') {
        var P = principal;
        var T = term;
        var N = rates.multiplier * T;

        var A = rates.primary;
        var A_1 = rates.primary;
        var A_2 = rates.secondary;

        if (term >= rates.trigger) {
            A = rates.secondary;
        }


        var J = (A * .01) / rates.multiplier;
        var J_1 = (A_1 * .01) / rates.multiplier;
        var J_2 = (A_2 * .01) / rates.multiplier;

        var C = 1 + J;

        var M = P * (J / (1 - Math.pow(C, -N)));
        var M_1 = P * (J_1 / (1 - Math.pow((1 + J_1), -N)));
        var M_2 = P * (J_2 / (1 - Math.pow((1 + J_2), -N)));

        var R = M * N;
        var R_1 = M_1 * N;
        var R_2 = M_2 * N;


        repayment = M;
        total = R;
        interest = R - P;

        primarytotal = R_1;
        primary = R_1 - P;

        secondarytotal = R_2;
        secondary = R_2 - P;
    }

    /*
    	Display the total
    */
    form.find('.interestrate').text(rate + '%');
    form.find('.current_interest').text(rates.cb + Math.floor(interest).toString().qis_separator(rates.separator) + rates.ca);
    form.find('.final_total').text(rates.cb + Math.floor(total).toString().qis_separator(rates.separator) + rates.ca);
    form.find('.primary_interest').text((rates.cb + Math.floor(primary).toString().qis_separator(rates.separator) + rates.ca));
    form.find('.primary_total').text((rates.cb + Math.floor(primarytotal).toString().qis_separator(rates.separator) + rates.ca));
    form.find('.secondary_interest').text((rates.cb + Math.floor(secondary).toString().qis_separator(rates.separator) + rates.ca));
    form.find('.secondary_total').text((rates.cb + Math.floor(secondarytotal).toString().qis_separator(rates.separator) + rates.ca));
    form.find('.repayment').text((rates.cb + Math.floor(repayment).toString().qis_separator(rates.separator) + rates.ca));
}
var qis__bubble = '<output class="rangeslider__value-bubble"></output>';
jQuery(document).on("ready", function ($) {
    /*
    	Select all relevant loan slider forms
    */
    $(qis_loan_selector).each(function () {
        /*
        	Initialize sliders
        */
        var sliders = $(this).find('[data-qis]'),
            x = $(this);
        sliders.change(qisCalculate);
        sliders.qis({
            polyfill: false,
            /*
            	Add the bubble to the handle element
            */
            onInit: function () {
                /*
                	Check if the 'rangeslider__value-bubble' is set!
                */

                if (qis__rates[x.attr('id')].usebubble) {
                    x.find('.qis__handle').append(qis__bubble);
                    x.find('.qis-slidercenter').remove();
                }

                // qis__handle
            }
        });

        sliders.change();
    });
});

function updateValueBubble(pos, value, context) {
    $ = jQuery;
    pos = pos || context.position;
    value = value || context.value;
    var $valueBubble = $('.rangeslider__value-bubble', context.$range);
    var tempPosition = pos + context.grabPos;
    var position = (tempPosition <= context.handleDimension) ? context.handleDimension : (tempPosition >= context.maxHandlePos) ? context.maxHandlePos : tempPosition;

    if ($valueBubble.length) {
        $valueBubble[0].style.left = Math.ceil(position) + 'px';
        $valueBubble[0].innerHTML = value;
    }
}

jQuery(document).on("ready", function () {
    jQuery(".apply").hide();
    jQuery(".toggle").toggle(function () {
        jQuery(this).addClass("toggle-active");
    }, function () {
        jQuery(this).removeClass("toggle-active");
    });
    jQuery(".toggle").on("click", function () {
        jQuery(this).next(".apply").slideToggle();
    });
});

String.prototype.qis_separator = function (sr) {
    if (sr == 'none') return this;
    else {
        var s = ((sr == 'comma') ? ',' : ' ');
    }
    var str = this.split('.');
    if (str[0].length >= 4) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1' + s);
    }
    return str.join('.');
}