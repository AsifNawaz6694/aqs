<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * GCC Cities by country.
     */
    protected array $gccCities = [
        'Saudi Arabia' => [
            'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran',
            'Jubail', 'Yanbu', 'Tabuk', 'Abha', 'Khamis Mushait', 'Najran', 'Jazan',
            'Hofuf', 'Buraidah', 'Taif', 'Hail', 'Arar', 'Sakaka',
        ],
        'United Arab Emirates' => [
            'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
            'Fujairah', 'Umm Al Quwain', 'Al Ain',
        ],
        'Qatar' => [
            'Doha', 'Al Wakrah', 'Al Khor', 'Al Rayyan', 'Umm Salal', 'Mesaieed',
        ],
        'Kuwait' => [
            'Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra', 'Ahmadi', 'Mangaf',
        ],
        'Bahrain' => [
            'Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra',
        ],
        'Oman' => [
            'Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri', 'Seeb', 'Barka',
        ],
    ];

    /**
     * Phone codes by country.
     */
    protected array $phoneCodes = [
        'Saudi Arabia' => '+966',
        'United Arab Emirates' => '+971',
        'Qatar' => '+974',
        'Kuwait' => '+965',
        'Bahrain' => '+973',
        'Oman' => '+968',
    ];

    /**
     * Sample company name prefixes and suffixes.
     */
    protected array $companyPrefixes = [
        'Al', 'Gulf', 'Arabian', 'Middle East', 'Royal', 'Golden', 'Premier',
        'Elite', 'Prime', 'United', 'National', 'International', 'Global',
    ];

    protected array $companyTypes = [
        'Trading', 'Industries', 'Enterprises', 'Solutions', 'Services',
        'Group', 'Holdings', 'Corporation', 'Company', 'Investments',
        'Construction', 'Engineering', 'Technology', 'Logistics', 'Foods',
        'Hospitality', 'Real Estate', 'Contracting', 'Equipment', 'Supplies',
    ];

    protected array $firstNames = [
        'Mohammed', 'Ahmed', 'Ali', 'Omar', 'Khalid', 'Fahad', 'Sultan', 'Saeed',
        'Rashid', 'Hassan', 'Ibrahim', 'Youssef', 'Nasser', 'Abdullah', 'Hamad',
        'Tariq', 'Majid', 'Waleed', 'Faisal', 'Adnan', 'Saleh', 'Mansour',
        'Fatima', 'Aisha', 'Maryam', 'Sara', 'Noura', 'Huda', 'Layla', 'Amina',
    ];

    protected array $lastNames = [
        'Al-Rashid', 'Al-Fahad', 'Al-Saud', 'Al-Thani', 'Al-Nahyan', 'Al-Maktoum',
        'Al-Sabah', 'Al-Khalifa', 'Al-Said', 'Al-Harthi', 'Al-Balushi', 'Al-Lawati',
        'Al-Dosari', 'Al-Qahtani', 'Al-Ghamdi', 'Al-Zahrani', 'Al-Harbi', 'Al-Otaibi',
        'Al-Mutairi', 'Al-Shammari', 'Al-Enezi', 'Al-Subaie', 'Al-Hajri', 'Al-Marri',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clients = [];
        $countries = array_keys($this->gccCities);

        for ($i = 1; $i <= 50; $i++) {
            $country = $countries[array_rand($countries)];
            $city = $this->gccCities[$country][array_rand($this->gccCities[$country])];
            $phoneCode = $this->phoneCodes[$country];

            $firstName = $this->firstNames[array_rand($this->firstNames)];
            $lastName = $this->lastNames[array_rand($this->lastNames)];

            $isCompany = rand(0, 100) > 30; // 70% are companies

            $companyName = null;
            if ($isCompany) {
                $prefix = $this->companyPrefixes[array_rand($this->companyPrefixes)];
                $type = $this->companyTypes[array_rand($this->companyTypes)];
                $companyName = "{$prefix} {$lastName} {$type}";
            }

            $phone = $phoneCode . ' 5' . rand(10000000, 99999999);
            $email = strtolower(str_replace([' ', '-', "'"], '', $firstName)) . '.' .
                     strtolower(str_replace(['Al-', ' ', "'"], '', $lastName)) .
                     rand(1, 99) . '@' .
                     ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'company.com'][array_rand(['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'company.com'])];

            $clients[] = [
                'type' => $isCompany ? 'company' : 'individual',
                'name' => "{$firstName} {$lastName}",
                'company_name' => $companyName,
                'email' => $email,
                'phone' => $phone,
                'contact_person' => "{$firstName} {$lastName}",
                'address_line_1' => 'Building ' . rand(1, 500) . ', Street ' . rand(1, 100),
                'city' => $city,
                'country' => $country,
                'status' => 'active',
                'classification' => ['regular', 'regular', 'regular', 'vip', 'wholesale', 'retail'][array_rand(['regular', 'regular', 'regular', 'vip', 'wholesale', 'retail'])],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert in chunks
        foreach (array_chunk($clients, 10) as $chunk) {
            Client::insert($chunk);
        }

        $this->command->info('Created 50 fake clients successfully!');
    }
}
