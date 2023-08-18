import json

def summarize (f):
    data = json.load(f)
    s = "\n".join(data['events'])
    print(s)
    with open("./summary.txt","w+") as f:
       f.write(s)


if __name__ == "__main__":
    date = input("which date do you want summary of : ")
    print(date)
    with open(f"./matches/{date}") as f:
        summarize(f)
    
