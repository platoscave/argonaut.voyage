
pub struct ArgoKey {
    value: u64
}

impl ArgoKey {
    const fn new() -> Self {
        ArgoKey { value: 0 }
    }

    const fn from_value(value: u64) -> Self {
        ArgoKey { value }
    }

    const fn from_string(s: &str) -> Self {
        ArgoKey {
            value: name_to_number(s),
        }
    }

    fn str(&self) -> String {
        number_to_name(self.value)
    }
}

fn char_to_symbol(c: char) -> u64 {
    if c >= 'a' && c <= 'z' {
        return (c as u64 - 'a' as u64) + 6;
    }
    if c >= '1' && c <= '5' {
        return (c as u64 - '1' as u64) + 1;
    }
    return 0;
}
fn name_to_number(str: &str) -> u64 {
    let mut name: u64 = 0;
    let mut i = 0;
    for c in str.chars().take(12) {
        name |= (char_to_symbol(c) & 0x1f) << (64 - 5 * (i + 1));
        i += 1;
    }
    if i == 12 {
        name |= char_to_symbol(str.chars().nth(12).unwrap()) & 0x0F;
    }
    name
}

fn number_to_name(nm: u64) -> String {
    let charmap: &[char] = &[
        '.', '1', '2', '3', '4', '5', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ];
    let mut str = String::from(".............");
    let mut tmp = nm;
    for i in 0..=12 {
        let c = charmap[(tmp & if i == 0 { 0x0f } else { 0x1f }) as usize];
        str.replace_range((12 - i)..=(12 - i), &c.to_string());
        tmp >>= if i == 0 { 4 } else { 5 };
    }
    let trim_right_dots = |str: &mut String| {
        if let Some(last) = str.rfind(|c: char| c != '.') {
            *str = str[..=last].to_string();
        }
    };
    trim_right_dots(&mut str);
    str
}
fn validate_name(str: &str, error_handler: impl FnOnce(String)) {
    let len = str.len();
    if len > 13 {
        return error_handler(format!(
            "Name {{ {} }} is more than 13 characters long",
            str
        ));
    }
    let value: u64 = name_to_number(str);
    let charmap: &[char] = &[
        '.', '1', '2', '3', '4', '5', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ];
    let mut str2 = String::from(".............");
    let mut tmp = value;
    for i in 0..=12 {
        let c = charmap[(tmp & if i == 0 { 0x0f } else { 0x1f }) as usize];
        str2.replace_range(12 - i..=12 - i, &c.to_string());
        tmp >>= if i == 0 { 4 } else { 5 };
    }
    let trim = |s: &mut String| {
        let mut i = s.len() - 1;
        while i >= 0 {
            if s.chars().nth(i).unwrap() != '.' {
                break;
            }
            i -= 1;
        }
        s.truncate(i + 1);
    };
    trim(&mut str2);
    if str2 != str {
        return error_handler(String::from("name not properly normalized"));
    }
}



// impl std::cmp::PartialEq for AccountNumber {
//     fn eq(&self, other: &Self) -> bool {
//         self.value == other.value
//     }
// }

// impl std::cmp::PartialOrd for AccountNumber {
//     fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
//         self.value.partial_cmp(&other.value)
//     }
// }

// impl std::cmp::Eq for AccountNumber {}

// impl std::cmp::Ord for AccountNumber {
//     fn cmp(&self, other: &Self) -> std::cmp::Ordering {
//         self.value.cmp(&other.value)
//     }
// }
