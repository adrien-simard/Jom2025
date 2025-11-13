import random
import tkinter as tk


TILE = 20
GRID_W, GRID_H = 30, 30
SPEED_MS = 120


class SnakeGame:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Snake - Tkinter")
        self.canvas = tk.Canvas(
            root,
            width=GRID_W * TILE,
            height=GRID_H * TILE,
            bg="#111318",
            highlightthickness=0,
        )
        self.canvas.pack()

        self.score_var = tk.StringVar(value="Score: 0")
        self.label = tk.Label(root, textvariable=self.score_var, fg="#e6edf3", bg="#111318")
        self.label.pack(fill="x")

        self.running = False
        self.paused = False
        self.after_id = None

        self.root.bind("<Up>", lambda e: self.set_dir(0, -1))
        self.root.bind("<Down>", lambda e: self.set_dir(0, 1))
        self.root.bind("<Left>", lambda e: self.set_dir(-1, 0))
        self.root.bind("<Right>", lambda e: self.set_dir(1, 0))
        self.root.bind("p", self.toggle_pause)
        self.root.bind("P", self.toggle_pause)
        self.root.bind("r", self.restart)
        self.root.bind("R", self.restart)

        self.reset()
        self.start()

    def reset(self):
        self.dir = (1, 0)
        cx, cy = GRID_W // 2, GRID_H // 2
        self.snake = [(cx - 1, cy), (cx, cy), (cx + 1, cy)]
        self.grow = 0
        self.score = 0
        self.spawn_food()
        self.update_score()
        self.render()

    def start(self):
        self.running = True
        self.paused = False
        self.tick()

    def restart(self, *_):
        if not self.running:
            self.canvas.delete("all")
            self.reset()
            self.start()

    def toggle_pause(self, *_):
        if not self.running:
            return
        self.paused = not self.paused
        if not self.paused:
            self.tick()
        else:
            self.canvas.delete("pause")
            self.canvas.create_text(
                GRID_W * TILE // 2,
                GRID_H * TILE // 2,
                text="PAUSE",
                fill="#ffd166",
                font=("Segoe UI", 24, "bold"),
                tags=("pause",),
            )

    def update_score(self):
        self.score_var.set(f"Score: {self.score}")

    def set_dir(self, dx, dy):
        if not self.running or self.paused:
            return
        cdx, cdy = self.dir
        if (dx, dy) == (-cdx, -cdy):
            return
        self.dir = (dx, dy)

    def spawn_food(self):
        empty = {(x, y) for x in range(GRID_W) for y in range(GRID_H)} - set(self.snake)
        if not empty:
            self.food = None
            return
        self.food = random.choice(tuple(empty))

    def step(self):
        if not self.running or self.paused:
            return
        dx, dy = self.dir
        hx, hy = self.snake[-1]
        nx, ny = hx + dx, hy + dy

        if nx < 0 or ny < 0 or nx >= GRID_W or ny >= GRID_H or (nx, ny) in self.snake:
            self.game_over()
            return

        self.snake.append((nx, ny))
        if self.food and (nx, ny) == self.food:
            self.grow += 1
            self.score += 1
            self.update_score()
            self.spawn_food()

        if self.grow > 0:
            self.grow -= 1
        else:
            self.snake.pop(0)

        self.render()

    def game_over(self):
        self.running = False
        if self.after_id:
            self.root.after_cancel(self.after_id)
            self.after_id = None
        self.canvas.create_text(
            GRID_W * TILE // 2,
            GRID_H * TILE // 2,
            text="GAME OVER\nR pour recommencer",
            fill="#ff7b72",
            font=("Segoe UI", 20, "bold"),
        )

    def tick(self):
        self.step()
        if self.running and not self.paused:
            self.after_id = self.root.after(SPEED_MS, self.tick)

    def render(self):
        self.canvas.delete("all")

        if self.food:
            fx, fy = self.food
            self.draw_cell(fx, fy, fill="#e5534b", outline="#b13b35")

        for i, (x, y) in enumerate(self.snake):
            if i == len(self.snake) - 1:
                self.draw_cell(x, y, fill="#3fb950", outline="#2a7b38")
            else:
                self.draw_cell(x, y, fill="#2ea043", outline="#226e30")

    def draw_cell(self, x, y, fill="#2ea043", outline="#1f6f2d"):
        x0, y0 = x * TILE, y * TILE
        x1, y1 = x0 + TILE, y0 + TILE
        self.canvas.create_rectangle(x0, y0, x1, y1, fill=fill, outline=outline)


if __name__ == "__main__":
    root = tk.Tk()
    SnakeGame(root)
    root.mainloop()

