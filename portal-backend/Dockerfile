# 1. Use an official Python "slim" image as the base
FROM python:3.11-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy all your application code into the container
COPY . .

# 5. Tell Docker the container will listen on port 8000
EXPOSE 8000

# 6. The command to run your app
# We use 0.0.0.0 to allow traffic from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]