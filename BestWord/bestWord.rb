
#Global Variables
$stillUsing = true
$validInput = false
$letters = ""
$listOfWords = []
$points = { 'a' => 1,
    'b' => 3,
    'c' => 3,
    'd' => 2,
    'e' => 1,
    'f' => 4,
    'g' => 2,
    'h' => 4,
    'i' => 1,
    'j' => 8,
    'k' => 5,
    'l' => 1,
    'm' => 3,
    'n' => 1,
    'o' => 1,
    'p' => 3,
    'q' => 10,
    'r' => 1,
    's' => 1,
    't' => 1,
    'u' => 1,
    'v' => 4,
    'w' => 4,
    'x' => 8,
    'y' => 4,
    'z' => 10
}

#This function implements an algorithm that determines the highest
# possible scoring word from the available dictionary given an array of characters.
def determineBestWord(lets)
    for i in 0..$listOfWords.length - 1
        wordChars = $listOfWords[i].split(//)
        combo = wordChars - lets
        if (combo.length == 0)
            puts "SOLUTION FOUND"
            puts "The highest scoring word that is possible with those letters is #{$listOfWords[i]}, which is worth #{calculateWordValue($listOfWords[i])} points!"
            return
        end
    end
    puts "NO AVAILABLE WORDS"
    puts "These letters could not make any word in the available dictionary."
end

#This function calculates the value of a word based on its letters
def calculateWordValue(lets)
    sum = 0
    for i in 0..lets.length-1
        sum += $points[lets[i]]
    end
    return sum
end

#This function attempts to obtain valid input from the user.
def getUserInput()
    puts "Provide your scrabble letters in one of the following ways:"
    puts "(1) As a string containing all your letters with no spaces"
    puts "(2) As a comma separated list of single letters with no spaces"
    rawLetters = gets.chomp.downcase

    $validInput = true
    lengthError = false
    contentError = false

    #Determine if there are commas in the input.  If so, split with comma delimiter.  Otherwise split after every character.
    if (rawLetters.scan(",").length > 0)
        $letters = rawLetters.split(",")
    else
        $letters = rawLetters.split(//)
    end

    #Check to make sure every "letter" is only one character and a valid scrabble letter.
    for i in 0..$letters.length-1
        nextLetter = $letters[i]
        if (nextLetter.length != 1)
            $validInput = false
            lengthError = true
        elsif (!$points.has_key?(nextLetter))
            $validInput = false
            contentError = true
        end
    end

    #Malformed input handling
    if (!$validInput)
        if (lengthError)
            puts "ERROR CODE 0 --> One or more of your listed items contained more than one character."
        end
        if (contentError)
            puts "ERROR CODE 1 --> One or more of your listed items is not a valid letter."
        end
        lengthError = false
        contentError = false
    end
end

##                                    ##
##                                    ##
## MAIN PROGRAM EXECUTION BEGINS HERE ##
##                                    ##
##                                    ##

#Load in the list of words from the text file located in this directory.
File.open('words.txt').each do |word|
    if (word.chomp.length > 0)
        $listOfWords.push(word.chomp)
    end
end

#Sort the array of words by their word value (descending order).
$listOfWords.sort_by! do |word|
    -1 * calculateWordValue(word)
end

#Introduction to user
puts "-----Welcome to Scrabble Word Optimizer.-----"

while ($stillUsing)
    #This loop runs until the user has provided a valid input of letters.
    while(!$validInput)
        getUserInput()
    end

    #This calls the algorithm that determines the best word possible.
    determineBestWord($letters)

    #This loop runs until the user has decided whether or not to input another list of letters.
    $validInput = false
    while (!$validInput)
        puts "Would you like to input another list of letters? Enter 'yes' or 'no'."
        response = gets.chomp
        if (response == "yes")
            $validInput = true
        elsif (response == "no")
            $stillUsing = false
            $validInput = true
        else
            puts "That is not a valid choice."
        end
    end
    $validInput = false
end
