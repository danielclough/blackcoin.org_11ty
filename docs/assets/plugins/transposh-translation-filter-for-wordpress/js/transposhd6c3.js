/*
 * Transposh v0.9.3
 * https://transposh.org/
 *
 * Copyright 2013, Team Transposh
 * Licensed under the GPL Version 2 or higher.
 * https://transposh.org/license
 *
 * Date: Mon, 06 May 2013 02:15:55 +0300
 */
(function (c) {
    function A(b, a) {
        if (c.trim(a).length !== 0) {
            var d = function () {
                var b = c(this).attr("id").substr(c(this).attr("id").lastIndexOf("_") + 1),
                    a = c("#" + e + "img_" + b);
                c("#" + e + b).attr("data-source", 1);
                a.removeClass("tr-icon-yellow").removeClass("tr-icon-green").addClass("tr-icon-yellow")
            };
            c("*[data-token='" + b + "'][data-hidden!='y']").html(a).each(d);
            c("*[data-token='" + b + "'][data-hidden='y']").attr("data-trans", a).each(d)
        }
    }

    function B(b, a) {
        clearTimeout(q);
        h.push(b);
        o.push(a);
        A(b, a);
        q = setTimeout(function () {
            var b = {
                    ln0: t_jp.lang,
                    sr0: p,
                    action: "tp_translation",
                    items: h.length
                },
                a;
            for (a = 0; a < h.length; a += 1) b["tk" + a] = h[a], b["tr" + a] = o[a], r += c("*[data-token='" + h[a] + "']").size();
            c.ajax({
                type: "POST",
                url: t_jp.ajaxurl,
                data: b,
                success: function () {
                    var b = r / i * 100;
                    t_jp.progress && c("#" + k).progressbar("value", b)
                }
            });
            o = [];
            h = []
        }, 200)
    }

    function j(b, a) {
        B(b, c("<div>" + c.trim(a) + "</div>").text());
        var d = (i - c("." + e + '[data-source=""]').size()) / i * 100;
        t_jp.progress && c("#" + l).progressbar("value", d)
    }

    function s(b, a, d) {
        c.ajax({
            url: t_jp.ajaxurl,
            dataType: "json",
            data: {
                action: "tp_gp",
                tl: d,
                q: b
            },
            success: a
        })
    }

    function t(b, a) {
        s(a, function (a) {
            c(a.results).each(function (a) {
                j(b[a], this)
            })
        }, t_jp.lang)
    }

    function u(b, a, d) {
        c.ajax({
            url: "https://www.googleapis.com/language/translate/v2",
            dataType: "jsonp",
            data: {
                key: t_jp.google_key,
                q: b,
                target: d,
                source: t_jp.olang
            },
            traditional: true,
            success: a
        })
    }

    function C(b, a) {
        u(a, function (d) {
            typeof d.error !== "undefined" ? t(b, a) : c(d.data.translations).each(function (a) {
                j(b[a], this.translatedText)
            })
        }, t_jp.lang)
    }

    function m(b, a, d) {
        if (t_jp.msn_key) {
            var f =
                "[";
            c(b).each(function (a) {
                f += '"' + encodeURIComponent(b[a].replace(/[\\"]/g, "\\$&").replace(/(\r\n|\n|\r)/gm, " ")) + '",'
            });
            f = f.slice(0, -1) + "]";
            c.ajax({
                url: "https://api.microsofttranslator.com/V2/Ajax.svc/TranslateArray?appId=" + t_jp.msn_key + "&to=" + d + "&texts=" + f,
                dataType: "jsonp",
                jsonp: "oncomplete",
                success: a
            })
        } else v === 1 ? setTimeout(function () {
            m(b, a, d)
        }, 500) : (v = 1, c.getScript("https://www.microsofttranslator.com/ajax/v2/toolkit.ashx?loc=en&amp;toolbar=none", function () {
            t_jp.msn_key = _mstConfig.appId;
            m(b, a, d)
        }))
    }

    function D(b, a) {
        p = 2;
        m(a, function (a) {
            c(a).each(function (a) {
                j(b[a], this.TranslatedText)
            })
        }, t_jp.binglang)
    }

    function w(b, a, d) {
        c.ajax({
            url: "https://api.apertium.org/json/translate",
            data: {
                q: b,
                langpair: t_jp.olang + "|" + d,
                markUnknown: "no"
            },
            dataType: "jsonp",
            traditional: true,
            success: a
        })
    }

    function E(b, a) {
        p = 3;
        w(a, function (a) {
            a.responseStatus >= 200 && a.responseStatus < 300 && (a.responseData.translatedText !== void 0 ? j(b[0], a.responseData.translatedText) : c(a.responseData).each(function (a) {
                this.responseStatus === 200 && j(b[a],
                    this.responseData.translatedText)
            }))
        }, t_jp.lang)
    }

    function x(b, a) {
        t_jp.msn && (t_jp.preferred === "2" || t_jp.google === void 0) ? D(b, a) : t_jp.apertium && (t_jp.olang === "en" || t_jp.olang === "es") ? E(b, a) : t_jp.google_key ? C(b, a) : t(b, a)
    }

    function y() {
        var b = [],
            a = 0,
            d = [],
            f = [];
        c("." + e + '[data-source=""]').each(function () {
            var e = c(this).attr("data-token"),
                g = c(this).attr("data-orig");
            g === void 0 && (g = c(this).html());
            b[g] !== 1 && (b[g] = 1, a + encodeURIComponent(g).length > F && (x(f, d), a = 0, d = [], f = []), a += encodeURIComponent(g).length, f.push(e),
                d.push(g))
        });
        x(f, d)
    }

    function z(b) {
        typeof c.xLazyLoader === "function" ? b() : (t_jp.$ = c, c.getScript(t_jp.plugin_url + "/js/lazy.js", b))
    }

    function n(b) {
        n.hit ? b() : (n.hit = true, z(function () {
            c.fn.propAttr = c.fn.prop || c.fn.attr;
            c.xLazyLoader({
                js: t_jp.jQueryUI + "jquery-ui.min.js",
                css: t_jp.jQueryUI + "themes/" + t_jp.theme + "/jquery-ui.css",
                success: b
            })
        }))
    }
    var F = 1024,
        i, e = t_jp.prefix,
        l = e + "pbar",
        k = l + "_s",
        p = 1,
        r = 0,
        q, h = [],
        o = [],
        v = 0;
    t_jp.dgpt = s;
    t_jp.dgt = u;
    t_jp.dmt = m;
    t_jp.dat = w;
    t_jp.tfl = z;
    t_jp.tfju = n;
    c(function () {
        if (t_jp.msn)
            if (t_jp.binglang =
                t_jp.lang, t_jp.binglang === "zh") t_jp.binglang = "zh-chs";
            else if (t_jp.binglang === "zh-tw") t_jp.binglang = "zh-cht";
        else if (t_jp.binglang === "mw") t_jp.binglang = "mww";
        c("." + e + "setdeflang").on("click", function () {
            c.ajax({
                url: t_jp.ajaxurl,
                data: {
                    action: "tp_cookie"
                },
                cache: false
            });
            c("." + e + "setdeflang").hide("slow");
            return false
        });
        i = c("." + e + '[data-source=""]').size();
        c.ajaxSetup({
            cache: true
        });
        if (i && !t_jp.noauto && (t_jp.google || t_jp.msn || t_jp.apertium)) t_jp.progress ? n(function () {
            c("#" + e + "credit").css({
                overflow: "auto"
            }).append('<div style="float: left;width: 90%;height: 10px" id="' +
                l + '"/><div style="margin-bottom:10px;float:left;width: 90%;height: 10px" id="' + k + '"/>');
            c("#" + l).progressbar({
                value: 0
            });
            c("#" + k).progressbar({
                value: 0
            });
            c("#" + k + " > div").css({
                background: "#28F828",
                border: "#08A908 1px solid"
            });
            y()
        }) : y();
        t_jp.edit && c.getScript(t_jp.plugin_url + "../../js/transposhedit.html")
    })
})(jQuery);