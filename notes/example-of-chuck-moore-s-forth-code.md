---
title: Example of Chuck Moore's FORTH code
date: 2026-08-16
tags: [forth, programming]
brain-id: 626d0569-c8b0-4171-9cbf-cfe71bbae2ab
---

```
\ ok16a.seq 2/2/95 jf
( EPROM Programmer, Chuck Moore, 1993 Aug 16)
( modified, C. H. Ting, 1993 Nov 23 for mode 2 operations )
( test text display, 3-4-94 cht )
( allot 3000 bytes for ram, include OKCHAR, 3-5-94 cht )
( OKCHAR6.SEQ has text demos, called from TEST.  3-11-94 cht )
( OKCHAR7.SEQ has MuP21.TXT manual demo. 7-16-94 cht )
( OKCHAR8.SEQ has menu captions, 7-17-94 cht )
( OKCHAR10.SEQ blocks of text and demo2, 8-8-94 cht )
( OKCHAR11.SEQ parallel output tests, 8-11-94 cht )
( OK12.seq Bit map display, 9-9-94 cht )
( include OKPICT and compressed pictures, 10-2094 cht )
( OK13.SEQ, 16 pictures, 10-7-94 cht, with OKPICT13.SEQ )
( include OKPICT14 for plastic chips, 01nov94cht )
( OK16.SEQ, add nop before a!, 05nov94cht )
( OK16a.SEQ, sram+text, OK16b.SEQ, sram+picture, OK16c.SEQ, rom+text )
( OK16x.SEQ, experiments with OKCHAR14, 06nov94cht )

empty  HEX  WARNING OFF


variable printing?
printing? on
variable debugging?
debugging? off

: .head ( addr -- addr )
   printing? @
   IF >IN @ 20 word count type space >IN !
      dup .
   THEN
   ;

: CR CR
   debugging? @
   if .s KEY 0D = abort" done"
   then
   ;

: 2-OR   ROT XOR >R  XOR R> ;
: 2AND   ROT AND >R  AND R> ;
: -OR   XOR ;

\ ADDRESS TO CLEAN commented out and replaced by FLOAD PCMCIA2 4/23/94 JF

FLOAD PCMCIA2        \ Jeff Fox 4/23/94

COMMENT:



( port 300: A0-A7  )
(      301: A8-15  )
(      302: A16-23 )
(      303:        )
(      304: D0-D7  )
(      305: bit0 CSL )
(           bit1 CSH )
(      306: bit0 OE  )
(           bit1 RD  )
(           bit2 WE  )
(           bit3     )
(           bit4 RD, STB )
(           bit5         )
(           bit6 WE, ACK )
(           bit7         )

: delay     4 0 do loop ;
: ADDRESS   C 302 PC!  DUP FLIP  301 PC!  300 PC!  ;
: DISABLE   7 305 PC!  7 306 PC!  ;
: ENABLE    6 305 PC!  ;
: 8255 ( n -- ) ( ports A,C output, mode 0)
   80 303 PC!  ( output )
   ( C0) 307 PC!  ( A,C mode 2, B mode 0 output )
    DISABLE ;
C0 8255
ENABLE

: READ 6 306 PC!  ;
: WRITE 7 306 PC!  ;
: READ-PULSE  4 306 PC!  6 306 PC!  ;
: WRITE-PULSE 3 306 PC!  7 306 PC!  ;

: ROM@ ( a - b)   ADDRESS  READ-PULSE
   304 PC@  ;

: RAM! ( b a)   ADDRESS  304 PC!  WRITE-PULSE ;

: CLEAN   WRITE  3000 0 DO  0 I RAM!  LOOP READ ;

COMMENT;
\ ADDRESS TO CLEAN commented out and replaced by FLOAD PCMCIA 4/23/94 JF

: VIEW ( a)   DUP .  10 0 DO  CR 10 0 DO  DUP ROM@ 3 .R
      1 + LOOP LOOP ;












CREATE ram  3000 ALLOT
: RESET   ram 3000 ERASE ;   RESET
: R@   3 * ram +  DUP 1 + @ FLIP  SWAP C@ ;
: R!   3 * ram +  SWAP OVER C!  SWAP FLIP  SWAP 1 + ! ;

: FOUR   4 0 DO  DUP R@ 6 D.R  1 + LOOP ;
: SHOW ( a)   10 0 DO  CR  DUP 3 .R SPACE
      FOUR SPACE FOUR  LOOP DROP ;
: SEND   WRITE  0 2FFF DO  I AAA -OR  ram + C@  I RAM!
      -1 +LOOP  READ ;
: CHECK   3000 0 DO  I AAA -OR  ram + C@  I ROM@  2DUP -OR IF
         CR I 3 .R  4 .R  3 .R  ELSE 2DROP  THEN LOOP ;
















































VARIABLE H
: LOC   CONSTANT  DOES> @  H ! ;
VOCABULARY 8-B   8-B DEFINITIONS   ( 8-bit instructions)
: , ( b)   H @ ram + C!   1 H +! ;
: INST   CONSTANT   DOES> @  , ;
: p   44 ,  , ;
: #   AA -OR p ;

41 INST @+    45 INST @     51 INST !+    55 INST !
80 INST com   81 INST 2*    84 INST 2/    85 INST +*
90 INST -or   91 INST and   95 INST +
C4 INST dup   C5 INST over  D4 INST nop   D5 INST drop
C0 INST pop   C1 INST a     D0 INST push  D1 INST a!
01 INST ;'

18 INST byte    A4D LOC :byte
30 INST word    A65 LOC :word
                AAA LOC ;reset
3A INST 0a!     A6F LOC :0a!
24 INST =0
20 INST jump
22 INST start

:0a!   a start  ( =0) ;'  nop nop nop
    ( jump) @+ a ( start) =0 jump
:byte   2* 2* 2* 2*  2* 2* 2* 2*
   push  00 # -or  pop -or ;'
:word   byte byte !+ ;'

;reset   pop pop dup ( clear stack pointers)
   -or a!  0a!

   83 p 0E p 0C p word           \ 0 = C0E83  address C and F modified jf
   46 p 0E p 0C p word           \ 1 = C0E46  to boot more than Chuck's
   55 p AA p 0A p word           \ 2 = AAA55  code
   21 p 4E p 06 p word           \ 3 = 64E21
   F9 p 4B p 0F p word           \ 4 = F4BF9
   FC p 0F p 06 p word           \ 5 = 60FFC
   55 p 81 p 00 p word           \ 6 = 08155
   55 p 49 p 08 p word           \ 7 = 84955
   F9 p 0B p 0F p word           \ 8 = F0BF9
   01 p C7 p 0B p word  a push   \ 9 = BC701
   DC p 21 p 06 p word           \ A = 621DC
   65 p F5 p 0F p word           \ B = FF565
\  AA p BA p 0A p word           \ C = ABAAA  1000= -FF000
   AA p AA p 02 p word           \ C = 2AAAA 80000= -80000 JF 11/17/94
   51 p C1 p 0A p word           \ D = AC151
   FC p 13 p 0B p word           \ E = B13FC
\  AA p AB p 0A p word ;'        \ F = AABAA   100
   8A p AA p 0A p word ;'        \ F = AAA8A    20         JF 11/17/94

\ Chuck's new boot code to fix the a! problem in plastic chips
\ thats the new boot code.  in reset a is set to 0 with a!
\ 0a! loops incrementing a while a<>0
\ in chips with a! problems below 6v this will take a second to
\ get the a register to 0

\ THIS BOOT CODE HAD TO BE CHANGED TO MATCH THE CHANGES IN THE 20
\ BIT BOOT CODE 11/17/94













FORTH DEFINITIONS   ( 20-bit instructions)
: 2,   , , ;

VARIABLE Hi   VARIABLE Hw
: ALIGN   10 Hi ! ;
: ORG   DUP . CR H !  ALIGN ;
: SWITCH   H @  SWAP  ORG ;
: IS   H @  Hi @ 10 / +  0 2CONSTANT ;

CREATE mask  AA800. 2,  55400. 2,  32A. 2,  D5. 2,
: p,   H @ R!  1 H +! ;
: #,   AAAAA. 2-OR p, ;
: ,w   Hw @ R@  2-OR  Hw @ R! ;
: ,I   Hi @ 10 AND IF  0 Hi !  H @ Hw !  0. p,  THEN
   Hi @ mask + 2@ 2AND  ,w  4 Hi +! ;

: INST   2CONSTANT   DOES> 2@  ,I ;
C0280. INST com   FF3FC. INST nop
: JMP   2CONSTANT  DOES> 2@  BEGIN  Hi @ 8 AND WHILE  nop  REPEAT
   ,I  3FF AND 155 -OR 0 ,w  ALIGN ;
: begin   BEGIN  Hi @ 10 AND 0= WHILE  nop  REPEAT  H @ ;
: -;'   Hw @ R@  OVER 4000 AND  IF 4000  ELSE 8000  THEN 0 2-OR  Hw @ R! ;
: p   3314C. ,I  p, ;
: -p   FFFFF. 2-OR  p com ;
: #   AAAAA. 2-OR p ;
: -#   55555. 2-OR p ;
: FIX   DROP 1 - >R  begin 0  AAAAA. 2-OR  R> R! ;

( bits 10 8 4 2 1: C0280 30140 0C030 0300C 00C03)
00000. JMP jump   0300C. JMP T=0    03C0F. JMP C=0    0C030. JMP call
                  0300C. JMP until  03C0F. JMP -until
: ':   begin  .head CONSTANT  DOES> @  call ;
: :KEY   begin  .head CONSTANT  DOES> @ 0  #, ;

: if   155 T=0  Hw @ ;
: -if   155 C=0  Hw @ ;
: skip   155 jump  Hw @ ;
: then   DUP >R >R  begin  3FF AND 155 -OR 0  R> R@ 2-OR  R> R! ;
: else   skip  SWAP then ;
: while   if  SWAP ;
: repeat   jump  then ;

30D43. INST @+  ( 33D4F. INST @ )   3CD73. INST !+    3FD7F. INST !
                  C0E83. INST 2*    C328C. INST 2/    C3E8F. INST +*
CC2B0. INST -or   CCEB3. INST and   CFEBF. INST +
F03C0. INST pop   F0FC3. INST a     F33CC. INST dup   F3FCF. INST over
FC3F0. INST push  FCFF3. INST a!
00C03. INST ;'

: !!+   dup ! !+ ;
: dup!!+   dup ! dup !+ ;
: ,   p  !!+ ;
: J   FFFFF. 2-OR #  !!+ ;

: ljump ' >body @ 0 #           \ get address of target word
   push ;' ;                    \ long jump

FFFFF. INST drop
33D4F. INST @

( black     blue      red  magenta    green     cyan   yellow    white    )
( 42108. , 08421. , 10842. , 18C63. , 21084. , 294A5. , 318C6. , 39CE7. , )
: brown   318C6. p ;
: blue   4A529. p ;    : red   5294A. p ;    : magenta  5AD6B. p ;
: green   6318C. p ;   : cyan   6B5AD. p ;   : yellow   739CE. p ;
: black   0. p ;       : white   7BDEF. p ;  : silver   39CE7. p ;

( Boot)  0 ORG
': byte   2* 2* 2* 2*
   2* 2* 2*  FF. #
   @+ and -or ;'
': word'   a push nop a! @+
   2* byte
   2* byte
   a pop nop a! push
   !+ pop ;'

\ Code from ok16a.seq boot sequence commented out jf Jeff Fox
\ ( A) ': BOOT   AA030. -# com  -FF000. #
\    begin push  word'
\      pop 100. # nop nop
\ ( 10) + -until

\ Code from ok4-.seq boot                    \ 11/17/94
( A) ': BOOT   AA030. -# com  -80000. #      \
   begin push  word'                         \
      pop 20. # nop nop                      \ BOOT 8* as much from SRAM 8/21/94
( 10) + -until                               \ 8k WORDS of DRAM=24k SRAM
                                             \ 16k .. 8/21/94

( Memory Map)
(   Host     SRAM           DRAM                   )
( number number pattern number pattern             )
(    003 1AA003 C.00AA9 000001 AAAAB    DRAM boot  )
(    033 1AA033             11          OK code    )
(                          304             end     )
(                          330          cos        )
(                          340          shapes     )
(                          350          dot masks  )
(                          36C                     )
(    A45 1AAA45                         SRAM boot  )
(    AAA 1AAAAA C.00000                 Reset      )
(    B98 1AAB98                                    )
(        100000 8.2AAAA   1000 ABAAA    Layout     )
(        1B0420          59210                     )
(                        AAAAA 00000    Video image)
(                        ABDE4          UL corner  )
(                        B9658                     )

( IO addresses for development board)

(        pattern com                               )
(        180026  7FFD9  write 8255 control         )
(        18000C  7FFF3  read port C                )
(        180024  7FFDB  write port C               )
(        1E0028  1FFD7  write configuration        )

( Observations        )
( over  doesn't work  )
(  1 -1 +  ripples 3  )
(  -1 1 +  ripples 9  )
(   nop +  ripples 19+)
( slot0 +  ripples 19+)

CR










70 SWITCH

\ I'm generating 1/line or 525/33 ms.  That's plenty for Toshiba, but the
\ others want 4/line.  To do that, change the video setup to:

': BSR   0. p  dup !+  !+ ( BBBB)
   05FF7. ,  BDEF7. ,  ;' ( BSRS SSSS)
': HR   BSR  BDFF7. p BDEF7. p ( SSRS SSSS)
   over over !+ !+  over over !+ !+  !+ !+
   9DEF7. , 00015. , ( KSSS BBBC)

\ That might make the video noise worse. C.M.
\ J.F. Does't seem to...

\ ': BSR   0. p nop nop nop  dup!!+  !!+ ( BBBB)
\    05FF7. ,  BDEF7. ,  ;' ( BSRS SSRS)

\ ': HR   BSR  BDEF7. p nop nop nop  dup!!+  !!+ ( SSRS)
\    BDEF7. p  ( SSSS)
\    dup!!+  dup!!+  dup!!+  !!+
\    9DEF7. , 00015. , ( KSSS BBBC)

   AD6B5. p ( CCCC)
   dup!!+  dup!!+  !!+
   AD6A0. , ( CCCB)
   0. p ( BBBB)
   dup!!+  !!+  ;'

': H   HR  A0000. #
': Bs   begin  0. ,
      1000. # nop nop nop
      + -until drop ;'
': E   BSR  BDEF7. p nop nop nop  dup!!+  !!+ ( SSSS)
   BDC00. ,  CE000. # Bs ( SSBB)
   BSR  9DEF7. ,  BDEF7. , ( KSSS SSSS)
   BDC00. ,  CE000. # Bs -;' ( SSBB)
': Ss   D2000. #
   begin  BDEF7. ,  1000. # ( SSSS)
      nop nop nop
      + -until  drop
   FA000. # Bs -;'
': V   BSR  BDEF7. ,  Ss ( SSSS)
   BSR  9DEF7. ,  Ss -;' ( KSSS)



SWITCH
AAAAA. # nop a!
( AAAAA VR1 21 114* 1+)
   E E E V V V E E E
   H H H H H H H H H H H H
   ABDD2. J
( AB405 VR2 22 114 1+)
   HR  D9000. # Bs  E E E V V V E E E
   C7000. # Bs  H H H H H H H H H H H H
   ABE45. J
( ABDD2+12 482 115*)
   E2000. #
   begin push  H
      a 74. #  nop nop
      nop + com nop  !!+ nop
      pop 100. #  nop nop
      + -until  drop
   H  AB405. J
   H  AAAAA. J
( B9658 60,334)











SWITCH

': 100ms   2. #
': -s
   1. #
   begin  +* -until
   drop drop ;'
': 500ms   100ms 100ms 100ms 100ms 100ms -;'


\ KEY? is not used in this version of OK because we just boot and jump
\      directly into P21Forth.  P21Forth checks for serial or parallel io.
\      7FFF3 works on the 8250 and on my hand wired chip with the 74hc244
\      70020 for the 245 according to Dr. Ting's notes

': KEY? ( n - n)   100ms
\  70020.                        ( '245 input )
\  7FFF3. p com nop a!  @            ( port 6 )  \ 7FFF3 on both systems JF
   7FFFF. p com nop a!  @            ( port 0 )  \ 7FFFF on NEW PCB
   55. # -or  7F. # and ;'    \ 55 KEY PAD
\  AA. # -or  7F. # and ;'    \ JF AA for my keyboard polarity

:KEY --
': KEY   begin  KEY?  until
   IS 'menu  0. # nop a!
   begin  @+ drop  2/ while repeat
   @ push ;'
': MENU   'menu # nop a!  pop  dup push  ! ;'


\ OKCHAR moved to here for menu captions. 17jul94cht

include OKCHAR14 ( bit map display 9-9-94 cht )
\ include OKPICT16 ( for plastic chips, 31oct94cht )

CR

100 ORG
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+   
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
   dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+  dup !+
': TWOS   drop skip

begin   a push
IS 'twos  nop nop  IS 'color      
      0. # TWOS -;'
SWAP then   73. # pop  nop nop + nop a!
': HIGH ( 22)  1. # nop nop +
      -until drop ;'
': COLOR ( 12)   a push  'color # nop a!  !  pop nop a! ;'

': WIDE ( 12)   a push  'twos # nop a!  2/ 2/ 2/  22065. p nop +  !
   pop nop a! ;'
': LINE   COLOR  120. # WIDE  1A. -# HIGH -;'

( line: BAE)
': UL   AC99A. # nop a! ;'  (  1)
': L2   AD54C. # nop a! ;'  (  2)
': LL   B78D0. # nop a! ;'  ( 16)






CR
\ bit display not used jf 2/2/95



': BIT   2* -if  03DE0. p  nop !+ ;'
': FOUR    BIT BIT BIT BIT
   then  0. p  nop !+ ;'
': ROW   FOUR FOUR FOUR FOUR FOUR
   drop  a 5A. # nop
   nop nop +  nop a! ;'
': x4   dup ROW  dup ROW
': x2   dup ROW  dup ROW -;'
': BITS ( n)   a  3FD. # nop a!  nop
   pop !+ pop !+ pop !  nop a!
   x4  x4  x4  x4
   dup -or  com x4 drop
   a  3FF. # nop a!  @ push
   3FD. # a!  @+ @  push push  nop a! ;'

CR

': +DUMP
:KEY DUMP   LL
IS 'dump   3F0. #  dup dup -or
   begin push  dup push BITS
      a 8DE. # com  nop
      +  pop nop a! push
      @+  pop a push nop a!
      AAAAA. # -or
      BITS
      a 14C6. # com  nop
      + nop a!  pop pop
      10000. # nop + -until
\  drop  KEY -;'
   A0000. # ljump caption

:KEY 1+   8. # skip
:KEY 1-   FFFF8. #
   then 'dump # nop a!  @ nop
   +  !  +DUMP -;'

CR

( ': +BANDS                      )
( :KEY BANDS   UL                )
(    08421. p LINE  4A529. p LINE)
(    10842. p LINE  5294A. p LINE)
(    18C63. p LINE  5AD6B. p LINE)
(    21084. p LINE  6318C. p LINE)
(    294A5. p LINE  6B5AD. p LINE)
(    318C6. p LINE  739CE. p LINE)
(    39CE7. p LINE  7BDEF. p LINE)
(    dup KEY -;'                 )

': -a   com a  nop nop + nop a! ;'
': BAR   COLOR  16A. -# HIGH  A291. # -a -;'
': BLOCK   COLOR  78. -# HIGH  35D9. # -a -;'
:KEY RS189   ABDEA. # nop a!  30. # WIDE  silver BAR  yellow BAR  cyan BAR
   green BAR  magenta BAR  red BAR  blue BAR
   B6086. # nop a!  38. # WIDE  red BLOCK  white BLOCK  magenta BLOCK
   C8. # WIDE  black BLOCK
   ( dup KEY -;')
   A0000. # ljump caption

': BLANK   black COLOR  ABDE4. # nop a!  180. # WIDE  1E2. -# HIGH -;'


CR



:KEY PAD   BAD. # -a  10. # WIDE  1A. -# HIGH -;'
:KEY VER   BAC. #  begin begin
   -a  8. # WIDE  1A. -# HIGH  0. # -a -;'
:KEY TL   888. # -a  8. # WIDE  0D. -# HIGH  8FA. # jump
:KEY TR   886. # -a  8. # WIDE  0D. -# HIGH  8FC. # jump

:KEY LD   888. # -a  8. # WIDE  0D. -# HIGH  5D5. #
   begin  -a  13. -# HIGH  0. # -a -;'
:KEY RD   886. # -a  8. # WIDE  0D. -# HIGH  5D7. # jump
:KEY LU   888. # -a  8. # WIDE  0D. -# HIGH  8FA. #
   begin  -a  14. -# HIGH  2B1. # a nop nop + nop a! ;'
:KEY RU   886. # -a  8. # WIDE  0D. -# HIGH  8FC. # jump
CR
:KEY HOR   888. #  begin begin
   -a  10. # WIDE  0D. -# HIGH  2B2. # a nop nop + nop a!
:KEY -   ;'
:KEY TD   2B0. # -a  8. # WIDE  6. -# HIGH  889. # jump
:KEY TU   BAC. # -a  8. # WIDE  7. -# HIGH  0. # jump

CR
\ jf not used 2/2/95

begin  340 ORG
   -  HOR VER LD LU RU RD TL TR TD TU - PAD PAD -  -  ORG
': SHAPE   F. # and if  340. # -or
      a push  a! @  pop nop a!  push ;'
   then drop ;'

': ROW   a  3FF. # nop a!  pop !  nop a!
   1. # begin
      a push  3F8. # nop a!  !

      10. # WIDE
      nop a! @  IS 'layer  FFFF. # and  a pop nop a! push
      dup 8. # and if  20004. p
      else  black  then COLOR drop
      1A. -# HIGH

      dup 7. # and if
         green COLOR
         BAD. # -a  1A. -# HIGH
      then drop

      red COLOR
      2/ 2/ 2/ 2/  dup SHAPE
      blue COLOR
      2/ 2/ 2/ 2/  dup SHAPE
      silver COLOR
      2/ 2/ 2/ 2/  SHAPE

      1. # pop nop +
      BA9. # -a  a push
      3F8. # nop a!  @  pop nop a!
      2* -until
   drop 26B. #  com nop +
   B5E. # a  nop +
   3FF. # nop a!  @ push  nop a! ;'


CR



:KEY +TILES
': TILES   UL  IS 'cursor  E194. ( 3940.) #
   ROW ROW ROW ROW
   ROW ROW ROW ROW
   ROW ROW ROW ROW
   ROW ROW ROW ROW
   KEY
\  A0028. # ljump caption

:KEY V+   1C20. # skip
:KEY V-   FE3E0. # skip
:KEY H+   C. # skip
:KEY H-   FFFF4. #
   then then then  'cursor # nop a!  @ nop
   +  !  TILES

': DEPTH   pop !  'layer # nop a!  !  TILES
:KEY LAYER   begin  8. # DEPTH
   F. # DEPTH
   FF. # DEPTH
   FFF. # DEPTH
   FFFF. # DEPTH
   jump

CR

': word   a push nop a!
   dup dup -or
   2* byte
   2* byte
   a pop nop a! push
   !+ pop ;'

': PAGE   1FFD7. p com nop a!  ! ;'
:KEY READ   1000. # nop a!  80000. -# com  -20000. #
   begin push  word
      pop 1. # nop nop + -until
   a 80001. p PAGE a!  80000. -# com  -20000. #
   begin push  word
      pop 1. # nop nop + -until

comment:
': 100us 400. # -s -;'
:KEY OUTTEST
   ( 0. p PAGE )
   7FFD9. p com nop a!   99. p !                   \ config
   7FFDD. p com nop a!
   begin 7. p !   100us   5. p !   100ms 100ms
         1. p !   100us   5. p !   100ms 100ms
   jump
comment;

:KEY OKAD   MENU TILES   V+ H+ H- V- READ LAYER  IS !MAIN --


















CR

': 'OK   80. # WIDE  34. -# HIGH
   20. # WIDE  68. -# HIGH
   80. # WIDE  34. -# HIGH
   45FB. # -a  20. # WIDE  68. -# HIGH
   4603. # -a  20. # WIDE  4E. -# HIGH
   80. # WIDE  34. -# HIGH
   20. # WIDE  4E. -# HIGH
   5D57. # -a  4E. -# HIGH
   1754. # a nop + a!  4E. -# HIGH -;'             \ jf

': 'OK'   BLANK
   08421. p COLOR  L2  5D9. # a nop + a!  'OK      \ jf
   blue COLOR  L2  'OK
\  dup KEY -;'
   A0000. # ljump caption

:KEY RESET   00000. p PAGE
   10. # nop a!  BOOT -;'

comment:
:KEY RAMP ( test output through a '374 latch, 06aug94cht )
   0. p PAGE
   ( KEY?) 7FFDF. ( 7FFF7.) p com nop a!              ( port 0 )
   2. # 1. #
   begin dup AAAAA. # -or !
   +* jump
comment;
CR

:KEY TEST                                                \ JF
:KEY CLSkey
': CLS   BLANK
\  KEY -;'
   A0050. # ljump caption

COMMENT:
:KEY TEST  MENU CLS  cap0 50dump+ 50dump-
                     cap+ CLSkey charSet RESET
comment:
:KEY TEST3  MENU CLS  demo11 demo12 demo13 demo14
                      demo15 demo16  reset

:KEY TEST2  MENU CLS  --     demo7  demo8  demo9
                      demo10 demo6   reset

:KEY TEST1  MENU CLS  --     demo2  demo3  demo4
                      demo5  demo1   reset
comment;

': showBlock C0001. p PAGE ljump +block

:KEY blocks
MENU showBlock
    +line +block -block -line +text -text reset

CR















\ modified OKCHAR by jfox with _emit and (KEY)
\ include OKCHAR ( character table and text utiltiy, 3-4-94 cht )











\ begin 350 ORG
\   AA800. p,  55400. p,  32A. p,  D5. p,  ORG
\ ': DOT   a! dup push a push
\   3. # and  350. # -or nop a!  pop pop @ push
\   LL  2/ 2/  a nop + nop a!
\   dup 2* 2*  dup push  dup 2*  nop +  nop +  a nop + nop a!
\   pop 2* 2* 2* 2* 2* com  a nop + nop a!
\   pop dup push  com @ and  pop white and -or  ! ;'
\
( begin 330 ORG DECIMAL                                                      )
(    200. #, 192. #, 171. #, 138. #, 100. #,  62. #,  29. #,   8. #,         )
(      0. #,   8. #,  29. #,  62. #, 100. #, 138. #, 171. #, 192. #,  HEX ORG)
( ': sin   C. # +                                       )
( ': cos   F. # and  330. # -or a!  @ 2/ ;'             )
( ': ssq   C. # +                                       )
( ': csq   8. # and  if drop 0. # ;'  then drop 64. # ;')

( :KEY PLOT   100. # begin dup push          )
(       dup 2/ 2/ 2/ csq  push               )
(       dup 2/ 2/ 2/ ssq  pop nop + DOT      )
(       pop dup push  dup 2/ 2/ 2/ cos  push )
(       dup 2/ 2/ 2/ sin  pop nop + DOT      )
(       pop  dup dup -or com  nop + -until   )
(    KEY -;'                                 )

SWITCH
7FFD9. p  com nop a!  9B. p  nop !         \ config 8255
40001. p PAGE                              \ mup21 config resgister set
!MAIN FIX
\ ': MAIN   MENU 'OK'  RS189 1+ 1- blocks TEST OKAD RESET

\ This now works 11/18/94
\ ': MAIN   MENU 'OK'  RS189 1+ 1- blocks TEST ( OKAD ) P21Forth RESET  \ jf TEST


\ from ok4-.seq
\ \ ': MAIN MENU 'OK' -;'  RS189 50dump+ 50dump-  PLOT charTst eForth  RESET
\ 2800 9/94
': MAIN $2800. # push ;'   \ jump directly to Forth  8/21/94  11/18/94 11/26/94





SWITCH .
begin .

```
