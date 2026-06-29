<?php

return [
    'name' => env('SCHOOL_NAME', 'Future Generation Private Basic School'),
    'academic_year' => env('ACADEMIC_YEAR', '2026-2027'),

    // Grade-based annual tuition prices (IQD)
    'study_prices' => [
        'one'   => 1300000,
        'two'   => 1400000,
        'three' => 1600000,
        'four'  => 1800000,
        'five'  => 2000000,
        'six'   => 2200000,
        'seven' => 2400000,
        'eight' => 2600000,
        'nine'  => 2800000,
    ],

    // Monthly food price (IQD)
    'food_price' => 150000,
];
