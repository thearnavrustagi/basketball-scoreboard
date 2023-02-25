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
    clock = {"minutes":12,"seconds":0,"running":false}
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

decrementTimer = () => {
    if (!clock.running) return
    clock.seconds -= 1

    if (clock.seconds < 0) {
        clock.seconds = 59
        clock.minutes -= 1
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