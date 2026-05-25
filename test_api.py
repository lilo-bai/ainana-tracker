# -*- coding: utf-8 -*-
"""
用urllib测试腾讯文档V3 API
"""
import urllib.request
import json

CLIENT_ID = "c88f4e99d1004e40b6b14f18d6666cfe"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbHQiOiJjODhmNGU5OWQxMDA0ZTQwYjZiMTRmMThkNjY2NmNmZSIsInR5cCI6MSwiZXhwIjoxNzgyMjg1NDk4LjMyNzEwNzIsImlhdCI6MTc3OTY5MzQ5OC4zMjcxMDcyLCJzdWIiOiI3OTM1ZTJkNzI5NTM0ZGIxODVmYzc1ZjA5YzY3N2IxMCJ9.SQMkaaNS2OJbWec6lqVuC9S9GSgjSN9JEjup3fMfEAc"
OPEN_ID = "7935e2d729534db185fc75f09c677b10"

FILE_ID = "VxIBbdoXkeXB"
SHEET_ID = "o5p9fc"

def call_api(range_spec):
    url = f"https://docs.qq.com/openapi/spreadsheet/v3/files/{FILE_ID}/{SHEET_ID}/{range_spec}"
    req = urllib.request.Request(url)
    req.add_header("Access-Token", ACCESS_TOKEN)
    req.add_header("Open-Id", OPEN_ID)
    req.add_header("Client-Id", CLIENT_ID)
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode('utf-8')
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return -1, str(e)

print("=== V3 API K列图像区域 ===")
status, data = call_api("K1:K8")
print(f"Status: {status}")
print(json.dumps(data, indent=2, ensure_ascii=False))

print("\n=== V3 API K6单格 ===")
status2, data2 = call_api("K6")
print(f"Status: {status2}")
print(json.dumps(data2, indent=2, ensure_ascii=False))
