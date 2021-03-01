/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

const specialThree = {
	'16': 'Shift',
	'17': 'Control',
	'18': 'Alt',
};

export const keyMap = {
	'8': 'BackSpace',
	'9': 'Tab',
	'12': 'Clear',
	'13': 'Enter',
	'19': 'Pause',
	'20': 'Caps_Lock',
	'27': 'Escape',
	'32': 'Space',
	'33': 'Prior',
	'34': 'Next',
	'35': 'End',
	'36': 'Home',
	'37': 'Left',
	'38': 'Up',
	'39': 'Right',
	'40': 'Down',
	'41': 'Select',
	'42': 'Print',
	'43': 'Execute',
	'45': 'Insert',
	'46': 'Delete',
	'47': 'Help',
	// ▼主键区数字
	'48': '0',
	'49': '1',
	'50': '2',
	'51': '3',
	'52': '4',
	'53': '5',
	'54': '6',
	'55': '7',
	'56': '8',
	'57': '9',
	// ▼字母键
	'65': 'a',
	'66': 'b',
	'67': 'c',
	'68': 'd',
	'69': 'e',
	'70': 'f',
	'71': 'g',
	'72': 'h',
	'73': 'i',
	'74': 'j',
	'75': 'k',
	'76': 'l',
	'77': 'm',
	'78': 'n',
	'79': 'o',
	'80': 'p',
	'81': 'q',
	'82': 'r',
	'83': 's',
	'84': 't',
	'85': 'u',
	'86': 'v',
	'87': 'w',
	'88': 'x',
	'89': 'y',
	'90': 'z',
	// ▼小键盘数字
	'96': 'KP_0',
	'97': 'KP_1',
	'98': 'KP_2',
	'99': 'KP_3',
	'100': 'KP_4',
	'101': 'KP_5',
	'102': 'KP_6',
	'103': 'KP_7',
	'104': 'KP_8',
	'105': 'KP_9',
	// ▼未知
	'106': 'KP_Multiply KP_Multiply',
	'107': 'KP_Add KP_Add',
	'108': 'KP_Separator KP_Separator',
	'109': 'KP_Subtract KP_Subtract',
	'110': 'KP_Decimal KP_Decimal',
	'111': 'KP_Divide KP_Divide',
	// ▼功能键
	'112': 'F1',
	'113': 'F2',
	'114': 'F3',
	'115': 'F4',
	'116': 'F5',
	'117': 'F6',
	'118': 'F7',
	'119': 'F8',
	'120': 'F9',
	'121': 'F10',
	'122': 'F11',
	'123': 'F12',
	// 其它
	'188': ',',
	'190': '.',
	'192': '`',
	'219': '[',
	'221': ']',
};

export default {
	...keyMap, 
	...specialThree,
};



/*
keycode    8 = BackSpace BackSpace
keycode    9 = Tab Tab
keycode   12 = Clear
keycode   13 = Enter
keycode   16 = Shift_L
keycode   17 = Control_L
keycode   18 = Alt_L
keycode   19 = Pause
keycode   20 = Caps_Lock
keycode   27 = Escape Escape
keycode   32 = space space
keycode   33 = Prior
keycode   34 = Next
keycode   35 = End
keycode   36 = Home
keycode   37 = Left
keycode   38 = Up
keycode   39 = Right
keycode   40 = Down
keycode   41 = Select
keycode   42 = Print
keycode   43 = Execute
keycode   45 = Insert
keycode   46 = Delete
keycode   47 = Help
keycode   48 = 0 equal braceright
keycode   49 = 1 exclam onesuperior
keycode   50 = 2 quotedbl twosuperior
keycode   51 = 3 section threesuperior
keycode   52 = 4 dollar
keycode   53 = 5 percent
keycode   54 = 6 ampersand
keycode   55 = 7 slash braceleft
keycode   56 = 8 parenleft bracketleft
keycode   57 = 9 parenright bracketright
keycode   65 = a A
keycode   66 = b B
keycode   67 = c C
keycode   68 = d D
keycode   69 = e E EuroSign
keycode   70 = f F
keycode   71 = g G
keycode   72 = h H
keycode   73 = i I
keycode   74 = j J
keycode   75 = k K
keycode   76 = l L
keycode   77 = m M mu
keycode   78 = n N
keycode   79 = o O
keycode   80 = p P
keycode   81 = q Q at
keycode   82 = r R
keycode   83 = s S
keycode   84 = t T
keycode   85 = u U
keycode   86 = v V
keycode   87 = w W
keycode   88 = x X
keycode   89 = y Y
keycode   90 = z Z
keycode   96 = KP_0 KP_0
keycode   97 = KP_1 KP_1
keycode   98 = KP_2 KP_2
keycode   99 = KP_3 KP_3
keycode 100 = KP_4 KP_4
keycode 101 = KP_5 KP_5
keycode 102 = KP_6 KP_6
keycode 103 = KP_7 KP_7
keycode 104 = KP_8 KP_8
keycode 105 = KP_9 KP_9
keycode 106 = KP_Multiply KP_Multiply
keycode 107 = KP_Add KP_Add
keycode 108 = KP_Separator KP_Separator
keycode 109 = KP_Subtract KP_Subtract
keycode 110 = KP_Decimal KP_Decimal
keycode 111 = KP_Divide KP_Divide
keycode 112 = F1
keycode 113 = F2
keycode 114 = F3
keycode 115 = F4
keycode 116 = F5
keycode 117 = F6
keycode 118 = F7
keycode 119 = F8
keycode 120 = F9
keycode 121 = F10
keycode 122 = F11
keycode 123 = F12
keycode 124 = F13
keycode 125 = F14
keycode 126 = F15
keycode 127 = F16
keycode 128 = F17
keycode 129 = F18
keycode 130 = F19
keycode 131 = F20
keycode 132 = F21
keycode 133 = F22
keycode 134 = F23
keycode 135 = F24
keycode 136 = Num_Lock
keycode 137 = Scroll_Lock
keycode 187 = acute grave
keycode 188 = comma semicolon
keycode 189 = minus underscore
keycode 190 = period colon
keycode 192 = numbersign apostrophe
keycode 210 = plusminus hyphen macron
keycode 211 =
keycode 212 = copyright registered
keycode 213 = guillemotleft guillemotright
keycode 214 = masculine ordfeminine
keycode 215 = ae AE
keycode 216 = cent yen
keycode 217 = questiondown exclamdown
keycode 218 = onequarter onehalf threequarters
keycode 220 = less greater bar
keycode 221 = plus asterisk asciitilde
keycode 227 = multiply division
keycode 228 = acircumflex Acircumflex
keycode 229 = ecircumflex Ecircumflex
keycode 230 = icircumflex Icircumflex
keycode 231 = ocircumflex Ocircumflex
keycode 232 = ucircumflex Ucircumflex
keycode 233 = ntilde Ntilde
keycode 234 = yacute Yacute
keycode 235 = oslash Ooblique
keycode 236 = aring Aring
keycode 237 = ccedilla Ccedilla
keycode 238 = thorn THORN
keycode 239 = eth ETH
keycode 240 = diaeresis cedilla currency
keycode 241 = agrave Agrave atilde Atilde
keycode 242 = egrave Egrave
keycode 243 = igrave Igrave
keycode 244 = ograve Ograve otilde Otilde
keycode 245 = ugrave Ugrave
keycode 246 = adiaeresis Adiaeresis
keycode 247 = ediaeresis Ediaeresis
keycode 248 = idiaeresis Idiaeresis
keycode 249 = odiaeresis Odiaeresis
keycode 250 = udiaeresis Udiaeresis
keycode 251 = ssharp question backslash
keycode 252 = asciicircum degree
keycode 253 = 3 sterling
keycode 254 = Mode_switch
*/

