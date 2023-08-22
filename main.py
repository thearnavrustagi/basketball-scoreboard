from flask import Flask
from flask import render_template, request, redirect
from time import time
from datetime import datetime
import json

app = Flask(__name__,static_folder="static")

@app.route("/",methods=["GET"])
def index():
    return render_template("index.html",N=12)

@app.route("/<string:team1>/<string:team2>",methods=["GET"])
def load_match_ui (team1,team2):
    team1_members = open(team1).read().splitlines()
    team2_members = open(team2).read().splitlines()
    return render_template("match.html",team1=team1,team2=team2,members_1=team1_members,members_2=team2_members,possible_scores=[1,2,3])

@app.route("/api/start_match/<team1>/<team2>",methods=["GET"])
def start_match(team1:str,team2:str):
    game = {"id" : time(), "events" : []}
    
    for i,team in [(1,team1),(2,team2)]:
        game[f"team{i}"]  = {
            "name"     : team,
            "score"    : 0,
            "quarters" : [dict({"score" : 0, "fouls" : 0}) for _ in [1,2,3,4]],
            "players"  : {} 
        }

        for player in open(team).read().splitlines():
            player = player.strip()
            if not player: continue
            game[f"team{i}"]["players"][player] = {"name":player, "score" : [], "fouls": 0}
    
    return game

@app.route ("/api/initialize_teams",methods=['POST'])
def initialize_teams():
    content = request.get_json()
    for k,v in content.items():
        with open (k,"w+") as f:
            txt = "\n".join([a.strip() for a in filter(lambda x:bool(x.strip()), v)])
            f.write(txt)
    t1,t2 = tuple(content.keys())
    return f"/{t1}/{t2}"

@app.route("/api/update_match/<game_id>",methods=["POST"])
def update_match(game_id):
    content = request.get_json()
    json.dump(content,open(f"./matches/{datetime.fromtimestamp(float(game_id)).strftime('%d_%m_%Y-%H:%M:%S')}","w+"),indent=4)
    return "OK"
