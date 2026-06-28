<?php

return [
    'name' => env('SCHOOL_NAME', 'Al-Noor Private School'),
    'academic_year' => env('ACADEMIC_YEAR', '2025-2026'),

    // Grade-based annual tuition prices (IQD)
    'study_prices' => [
        'one'   => 1300000,
        'two'   => 1400000,
        'three' => 1600000,
        'four'  => 1800000,
        'five'  => 2000000,
    ],

    // Monthly food price (IQD)
    'food_price' => 150000,
];
