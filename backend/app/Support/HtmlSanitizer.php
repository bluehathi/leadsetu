<?php

namespace App\Support;

use HTMLPurifier;
use HTMLPurifier_Config;

/** Allow-list HTML sanitizer for user-authored email bodies (no scripts, handlers, iframes or data: URIs). */
class HtmlSanitizer
{
    public static function clean(string $html): string
    {
        static $purifier;

        if (! $purifier) {
            $config = HTMLPurifier_Config::createDefault();
            $config->set('HTML.Allowed', 'p,br,hr,b,strong,i,em,u,s,span[style],div[style],a[href|title|target],ul,ol,li,h1,h2,h3,h4,blockquote,img[src|alt|width|height],table,thead,tbody,tr,td[colspan],th[colspan]');
            $config->set('CSS.AllowedProperties', 'color,background-color,font-size,font-weight,text-align,text-decoration,margin,padding');
            $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true, 'mailto' => true]);
            $config->set('Attr.AllowedFrameTargets', ['_blank']);
            $config->set('Cache.DefinitionImpl', null);
            $purifier = new HTMLPurifier($config);
        }

        return $purifier->purify($html);
    }
}
