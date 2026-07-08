.PHONY: agent test web build clean

agent:
	python -m agent.main

test:
	pytest agent/tests -q

web:
	cd web && npm install && npm run dev

build:
	cd web && npm install && npm run build

clean:
	rm -rf web/dist .pytest_cache agent/**/__pycache__
