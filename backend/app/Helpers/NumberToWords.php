<?php

namespace App\Helpers;

class NumberToWords
{
    private static $units = [
        0 => '',
        1 => 'یەک',
        2 => 'دوو',
        3 => 'سێ',
        4 => 'چوار',
        5 => 'پێنج',
        6 => 'شەش',
        7 => 'حەوت',
        8 => 'هەشت',
        9 => 'نۆ',
    ];

    private static $teens = [
        10 => 'دە',
        11 => 'یازدە',
        12 => 'دوازدە',
        13 => 'سێزدە',
        14 => 'چواردە',
        15 => 'پازدە',
        16 => 'شازدە',
        17 => 'حەڤدە',
        18 => 'هەژدە',
        19 => 'نۆزدە',
    ];

    private static $tens = [
        20 => 'بیست',
        30 => 'سی',
        40 => 'چل',
        50 => 'پەنجا',
        60 => 'شەست',
        70 => 'حەفتا',
        80 => 'هەشتا',
        90 => 'نەوەد',
    ];

    private static $hundreds = [
        100 => 'سەد',
        200 => 'دووسەد',
        300 => 'سێسەد',
        400 => 'چوارسەد',
        500 => 'پێنجسەد',
        600 => 'شەشسەد',
        700 => 'حەوتسەد',
        800 => 'هەشتسەد',
        900 => 'نۆسەد',
    ];

    private static function convertThreeDigits($num)
    {
        $parts = [];

        if ($num >= 100) {
            $h = (int)($num / 100) * 100;
            $parts[] = self::$hundreds[$h];
            $num %= 100;
        }

        if ($num >= 20) {
            $t = (int)($num / 10) * 10;
            $parts[] = self::$tens[$t];
            $num %= 10;
            if ($num > 0) {
                $parts[] = self::$units[$num];
            }
        } elseif ($num >= 10) {
            $parts[] = self::$teens[$num];
        } elseif ($num > 0) {
            $parts[] = self::$units[$num];
        }

        return implode(' و ', $parts);
    }

    /**
     * Convert an integer amount to Kurdish words.
     */
    public static function toKurdish($number)
    {
        $number = (int)$number;
        if ($number === 0) {
            return 'سفر';
        }

        $parts = [];

        // Billions (ملیار)
        $billions = (int)($number / 1000000000);
        if ($billions > 0) {
            $billionsWord = self::convertThreeDigits($billions);
            if ($billions === 1) {
                $parts[] = "یەک ملیار";
            } else {
                $parts[] = $billionsWord . ' ملیار';
            }
            $number %= 1000000000;
        }

        // Millions (ملیۆن)
        $millions = (int)($number / 1000000);
        if ($millions > 0) {
            $millionsWord = self::convertThreeDigits($millions);
            if ($millions === 1) {
                $parts[] = "یەک ملیۆن";
            } else {
                $parts[] = $millionsWord . ' ملیۆن';
            }
            $number %= 1000000;
        }

        // Thousands (هەزار)
        $thousands = (int)($number / 1000);
        if ($thousands > 0) {
            $thousandsWord = self::convertThreeDigits($thousands);
            if ($thousands === 1) {
                $parts[] = "هەزار";
            } else {
                $parts[] = $thousandsWord . ' هەزار';
            }
            $number %= 1000;
        }

        // Units
        if ($number > 0) {
            $parts[] = self::convertThreeDigits($number);
        }

        return implode(' و ', $parts);
    }

    /**
     * Convert an integer amount to English words.
     */
    public static function toEnglish($number)
    {
        $number = (int)$number;
        if (class_exists('NumberFormatter')) {
            $f = new \NumberFormatter('en', \NumberFormatter::SPELLOUT);
            return $f->format($number);
        }

        return number_format($number);
    }
}
