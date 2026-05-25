# -*- coding: utf-8 -*-
"""处理CSV → JSON，供前端加载"""
import csv
import json
from pathlib import Path

CSV_FILE = Path(__file__).parent / "raw.csv"
JSON_FILE = Path(__file__).parent / "data.json"

def normalize(v):
    if v is None:
        return "/"
    s = str(v).strip()
    return s if s and s != "None" else "/"

def main():
    items = []
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        print("表头:", header)
        for row in reader:
            if not row or not row[0].strip():
                continue
            item = {
                "id": normalize(row[0]),
                "channel": normalize(row[1]) if len(row) > 1 else "/",
                "status": normalize(row[2]) if len(row) > 2 else "/",
                "arrivalDate": normalize(row[6]) if len(row) > 6 else "/",
                "storageDDL": normalize(row[7]) if len(row) > 7 else "/",
                "note": normalize(row[8]) if len(row) > 8 else "/",
                "orderNote": normalize(row[9]) if len(row) > 9 else "/",
                "sheet": "煤骏",
                "image": "/"
            }
            items.append(item)

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"处理完成：{len(items)} 条数据 → {JSON_FILE}")

if __name__ == "__main__":
    main()
