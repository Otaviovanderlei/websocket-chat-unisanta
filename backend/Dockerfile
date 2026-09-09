FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY WebSocketChat.Api.csproj ./

RUN dotnet restore

COPY . .

RUN dotnet publish \
    WebSocketChat.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore


FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 10000

CMD ["sh", "-c", "dotnet WebSocketChat.Api.dll --urls http://0.0.0.0:${PORT:-10000}"]