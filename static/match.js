$ = s => document.getElementById(s)
var playerToTeam = {}
var activePlayers = {"team1":[],"team2":[]}
var game = {}
var swappable = {
    "team1" : "",
    "team2" : "",
}
var quarter_number = 0

resetClock = () => {
    clock = {"minutes":1,"seconds":0,"running":false}
    update_timer_ui()
}
var clock = {}

main = async () => {
    resetClock()
    game = await initialiseGame($("team1").value,$("team2").value)
}

initialiseGame = async (team1,team2) => {
    let game = await fetch(`/api/start_match/${team1}/${team2}`).
        then (response => response.json()).
        then (data => data)
    for (player in game.team1.players) {
        playerToTeam[player] = "team1"
    }
    for (player in game.team2.players) {
        playerToTeam[player] = "team2"
    }
    console.log(game)
    return game
}

manageMembers = member => {
    console.log(member)
    team=playerToTeam[member]
    console.log(activePlayers[team])
    if ((activePlayers[team]).length < 5) {
        if (!activePlayers[team].includes(member)) {
            activePlayers[team].push(member)
            $(member).style.opacity = "100%"
        }
    } else {
        if (activePlayers[team].includes(member)) {
            if (swappable[team] != "") {
                add_event(`${swappable[team]} is substituting ${member}`)
                activePlayers[team].push(swappable[team])
                $(swappable[team]).style.opacity = "100%"
                activePlayers[team].splice(activePlayers[team].indexOf(member),1)
                $(member).style.opacity = "25%"
            }
        } else {
            swappable[team] = member
        }
    }
}

modify_for = element => {
    score = element.textContent[1]
    player = element.parentNode.parentNode.id
    if (!(player_is_active(player) && clock.running)) {
        my_alert("player is not active or game is not running")
        return
    }
    if (score == 'F') {
        foul_player(player)
    } else {
        score_player(player,parseInt(score))
    }
}

player_is_active = player => activePlayers[playerToTeam[player]].includes(player)

foul_player = player => {
    team = playerToTeam[player]
    game[team].players[player].fouls += 1
    if(game[team].players[player].fouls >= 5) {
        $(`${player}-name`).style.textDecoration = "line-through"
    }
    add_event(`${player} committed a foul and has ${game[team].players[player].fouls} fouls`)
    foul_team (team)
    update_player_score_UI(player)
}


foul_team = team => {
    game[team].quarters[quarter_number].fouls += 1
    fouls = game[team].quarters[quarter_number].fouls
    console.log(fouls)
    add_event(`${game[team].name} got a foul, having a total of ${fouls} fouls `)
    if (fouls > 4) add_event(`${game[team].name} is in foul trouble !`)
    update_team_ui(team)
}

add_event = str => {
    game.events.push(`[ ${get_current_time()} ] ${str}`)
    sync()
}

score_player = (player,score) => {
    team = playerToTeam[player]
    game[team].score += score
    game[team].players[player].score.push(score)
    game[team].quarters[quarter_number].score += score
    add_event(`${player} scored ${score} points !`)
    update_team_ui(team)
    update_player_score_UI(player)
}

update_team_ui = teamname => {
    $(`${teamname}-score`).textContent = ""+game[teamname].score
    $(`${teamname}-fouls`).textContent = ""+game[teamname].quarters[quarter_number].fouls
}

update_player_score_UI = player => {
    fouls = game[team].players[player].fouls
    score = game[team].players[player].score.reduce((_sum,a) => _sum+a,0)

    $(`${player}-score`).textContent = ""+score;
    $(`${player}-fouls`).textContent = ""+fouls;
}

my_alert = str => {
    console.log(str)
}

get_current_time = () => `${clock.minutes}:${clock.seconds}`

toggleTimer = element => {
    if (!(activePlayers["team1"].length == 5 && activePlayers["team2"].length == 5)) {
        alert("select 5 members in each team")
        return
    }
    if (clock.running) {
        element.classList.add("fa-play")
        element.classList.remove("fa-pause")
        clock.running = false
    } else if (!clock.running){
        element.classList.add("fa-pause")
        element.classList.remove("fa-play")
        clock.running = true
        setTimeout(decrementTimer,1000)
    }
}

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}

decrementTimer = () => {
    if (!clock.running) return
    clock.seconds -= 1

    if (clock.seconds < 0) {
        clock.seconds = 59
        clock.minutes -= 1
    }

    if (clock.minutes < 1) {
	    beep()
    }

    if (clock.minutes < 0) {
        add_event(`Quarter ${quarter_number+1} ended`)
        toggleTimer($("play-button"))
        start_next_quarter()
    }

    update_timer_ui()
    if (clock.running) {
        setTimeout(decrementTimer,1000)
    }
}

update_timer_ui = () => {
    $("minutes").textContent = clock.minutes
    seconds = ""+clock.seconds
    if (seconds.length < 2) seconds = "0"+seconds
    $("seconds").textContent = seconds
}

start_next_quarter = () => {
    if (quarter_number > 3) {
        end_game()
    }
    quarter_number += 1
    update_team_ui("team1")
    update_team_ui("team2")
    update_quarter_ui()
    resetClock()
}

update_quarter_ui = () => $("quarter-number").textContent = (quarter_number+1)

end_game = () => {
    sync()
}

sync = () => {
    fetch (`/api/update_match/${game.id}`,{
        method: 'POST',
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify(game)
    })
}

main()
